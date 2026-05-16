// ================================================================
//  TravelApp v3 Backend - server.js
//  Features: Auth, Hotels, Trips, Bookings, Payment,
//            Admin, Chatbot, India Destinations, Notifications
// ================================================================
const express  = require("express");
const mongoose = require("mongoose");
const bcrypt   = require("bcryptjs");
const jwt      = require("jsonwebtoken");
const cors     = require("cors");
const crypto   = require("crypto");
const Razorpay = require("razorpay");
const nodemailer = require("nodemailer");
const QRCode   = require("qrcode");
const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

const app = express();
app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json());

process.on("uncaughtException", (err) => {
  if (err.code === "EADDRINUSE") {
    const port = process.env.PORT || 5000;
    console.error(`Port ${port} is already in use. Stop the old backend process or set a different PORT in backend/.env.`);
    process.exit(1);
  }
  console.error("Uncaught backend error:", err);
  process.exit(1);
});

const razorpay = process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET
  ? new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    })
  : null;

// ── MongoDB ──────────────────────────────────────────────────────
mongoose
  .connect(process.env.MONGO_URL || "mongodb://localhost:27017/travelapp")
  .then(async () => {
    console.log("MongoDB connected");
    await ensureInitialAdmin();
  })
  .catch(err => console.log("❌ MongoDB error:", err.message));

// ================================================================
//  MODELS
// ================================================================
const User = mongoose.model("User", new mongoose.Schema({
  name:     { type: String, required: true },
  email:    { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role:     { type: String, default: "user" },
}, { timestamps: true }));

const Trip = mongoose.model("Trip", new mongoose.Schema({
  userId: String, tripName: String, destination: String,
  startDate: String, endDate: String, budget: Number,
  travelers: { type: Number, default: 1 }, activities: [String], notes: String,
}, { timestamps: true }));

const Hotel = mongoose.model("Hotel", new mongoose.Schema({
  name: String, location: String, city: String, state: String,
  description: String, price: Number,
  rating: { type: Number, default: 4 },
  image:  { type: String, default: "" },
  amenities: [String],
  rooms:    { type: Number, default: 10 },
  category: { type: String, default: "Standard" },
  season:   { type: [String], default: ["All"] },
  awsImageUrl: { type: String, default: "" },
}, { timestamps: true }));

const Booking = mongoose.model("Booking", new mongoose.Schema({
  bookingType: { type: String, default: "hotel" },
  userId: String, hotelId: mongoose.Schema.Types.ObjectId,
  hotelName: String, checkIn: String, checkOut: String,
  guests: Number, totalPrice: Number, nights: Number,
  roomType: String, roomView: String, roomPrice: Number, roomsBooked: Number,
  roomNumbers: [String],
  transportMode: String, source: String, destination: String,
  travelDate: String, passengers: Number, seatClass: String, provider: String,
  seatType: String, seatNumber: String, seatPrice: Number, seatsBooked: Number,
  paymentStatus: { type: String, default: "pending" },
  paymentId: String,
  razorpayOrderId: String,
  receiptNumber: String,
  receiptUrl: String,
  receiptQrCode: String,
  receiptEmailedAt: Date,
  receiptEmailStatus: String,
  status:    { type: String, default: "confirmed" }, // confirmed / cancelled
  cancelledAt: Date,
  cancelReason: String,
}, { timestamps: true }));

const Notification = mongoose.model("Notification", new mongoose.Schema({
  userId:  String,
  type:    String, // booking_confirmed / booking_cancelled / payment_success / reminder
  title:   String,
  message: String,
  read:    { type: Boolean, default: false },
  data:    Object,
}, { timestamps: true }));

const IndiaDest = mongoose.model("IndiaDest", new mongoose.Schema({
  name:        String,
  state:       String,
  description: String,
  bestSeason:  [String],  // Summer / Winter / Monsoon / All Year
  category:    String,    // Beach / Mountain / Heritage / Wildlife / Pilgrimage / Adventure / City
  lat:  Number,
  lng:  Number,
  image:       { type: String, default: "" },
  awsImageUrl: { type: String, default: "" },
  aliases: [String],
  topAttractions: [String],
  avgBudgetPerDay: Number,
  rating: { type: Number, default: 4.0 },
}, { timestamps: true }));

async function ensureInitialAdmin() {
  const admin = await User.findOne({ role: "admin" });
  if (admin) return;

  const firstUser = await User.findOne().sort({ createdAt: 1 });
  if (!firstUser) return;

  firstUser.role = "admin";
  await firstUser.save();
  console.log(`Initial admin enabled for ${firstUser.email}`);
}

// ================================================================
//  AUTH MIDDLEWARE
// ================================================================
async function checkLogin(req, res, next) {
  const token = req.headers["authorization"];
  if (!token) return res.status(401).json({ message: "Please login first" });
  try {
    const d = jwt.verify(token, process.env.JWT_SECRET || "mysecretkey123");
    const user = await User.findById(d.id).select("role");
    if (!user) return res.status(401).json({ message: "Invalid token" });
    req.userId = d.id; req.userRole = user.role; next();
  } catch { res.status(401).json({ message: "Invalid token" }); }
}
function checkAdmin(req, res, next) {
  if (req.userRole !== "admin") return res.status(403).json({ message: "Admin only" });
  next();
}

function frontendBaseUrl() {
  return process.env.FRONTEND_URL || "http://localhost:5173";
}

function money(value) {
  return `Rs ${Number(value || 0).toLocaleString("en-IN")}`;
}

function bookingTitle(booking) {
  if (booking?.bookingType === "transport") {
    return `${booking.transportMode || "Travel"}: ${booking.source || ""} to ${booking.destination || ""}`.trim();
  }
  return booking?.hotelName || "Hotel booking";
}

function assignRoomNumbers(roomId = "classic", roomsBooked = 1) {
  const floorByRoom = { classic: 1, deluxe: 2, suite: 3, premium: 4 };
  const floor = floorByRoom[String(roomId).toLowerCase()] || 1;
  const start = Math.floor(1 + Math.random() * 40);
  return Array.from({ length: Math.max(1, Number(roomsBooked || 1)) }, (_, index) => `${floor}${String(start + index).padStart(2, "0")}`);
}

function receiptDetails(booking, user, hotel) {
  const details = booking.bookingType === "transport"
    ? [
        ["Trip", bookingTitle(booking)],
        ["Travel Date", booking.travelDate],
        ["Operator", booking.provider],
        ["Class", booking.seatClass],
        ["Seat Type", booking.seatType || "Auto assigned"],
        ["Seat Number", booking.seatNumber || "Auto assigned"],
        ["Passengers", booking.passengers],
      ]
    : [
        ["Hotel", booking.hotelName],
        ["Place", hotel?.location || [hotel?.city, hotel?.state].filter(Boolean).join(", ") || "Hotel location"],
        ["Check-in", booking.checkIn],
        ["Check-out", booking.checkOut],
        ["Room Type", booking.roomType || "Classic Room"],
        ["Room View", booking.roomView || "Standard"],
        ["Room Number", booking.roomNumbers?.length ? booking.roomNumbers.join(", ") : "Assigned at check-in"],
        ["Rooms Booked", booking.roomsBooked || 1],
        ["Guests", booking.guests],
        ["Nights", booking.nights],
      ];

  return {
    receiptNumber: booking.receiptNumber,
    paymentId: booking.paymentId,
    orderId: booking.razorpayOrderId,
    paidAt: booking.updatedAt,
    customer: { name: user?.name || "Guest", email: user?.email || "" },
    title: bookingTitle(booking),
    bookingType: booking.bookingType || "hotel",
    amount: booking.totalPrice,
    amountText: money(booking.totalPrice),
    details: details.filter(([, value]) => value !== undefined && value !== null && value !== ""),
  };
}

function receiptEmailHtml(receipt, receiptUrl) {
  const rows = receipt.details.map(([label, value]) => (
    `<tr><td style="padding:9px 10px;border-bottom:1px solid #edf1f5;color:#667085">${label}</td><td style="padding:9px 10px;border-bottom:1px solid #edf1f5;font-weight:700;color:#1f2937">${value}</td></tr>`
  )).join("");

  return `
    <div style="font-family:Arial,sans-serif;max-width:640px;margin:auto;color:#1f2937">
      <h2 style="color:#1e3a5f;margin-bottom:6px">TravelApp E-Bill / Receipt</h2>
      <p>Hello ${receipt.customer.name}, your payment is successful. Your receipt is attached as a QR code and available online.</p>
      <table style="width:100%;border-collapse:collapse;margin:18px 0;border:1px solid #edf1f5">${rows}</table>
      <p style="font-size:18px"><strong>Total Paid:</strong> ${receipt.amountText}</p>
      <p><strong>Receipt No:</strong> ${receipt.receiptNumber}<br><strong>Payment ID:</strong> ${receipt.paymentId}</p>
      <p>Scan the attached QR code or open this receipt link:<br><a href="${receiptUrl}">${receiptUrl}</a></p>
    </div>
  `;
}

async function generateReceiptPdf(receipt, qrDataUrl) {
  return new Promise(async (resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const chunks = [];
      
      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Header
      doc.fillColor('#1e3a5f').fontSize(24).text('TravelApp E-Bill', { align: 'center' });
      doc.moveDown();
      doc.fillColor('#333').fontSize(12).text('Payment Receipt', { align: 'center' });
      doc.moveDown(2);

      // Customer Info
      doc.fillColor('#1e3a5f').fontSize(14).text('Customer Details');
      doc.fillColor('#333').fontSize(11);
      doc.text(`Name: ${receipt.customer.name}`);
      doc.text(`Email: ${receipt.customer.email}`);
      doc.moveDown();

      // Booking Details
      doc.fillColor('#1e3a5f').fontSize(14).text('Booking Details');
      doc.moveDown(0.5);
      
      receipt.details.forEach(([label, value]) => {
        doc.fillColor('#666').fontSize(10).text(`${label}:`, { continued: true });
        doc.fillColor('#333').fontSize(10).text(` ${value}`);
      });
      doc.moveDown();

      // Payment Info
      doc.fillColor('#1e3a5f').fontSize(14).text('Payment Information');
      doc.moveDown(0.5);
      doc.fillColor('#333').fontSize(11);
      doc.text(`Receipt Number: ${receipt.receiptNumber}`);
      doc.text(`Payment ID: ${receipt.paymentId}`);
      doc.text(`Order ID: ${receipt.orderId}`);
      doc.text(`Amount Paid: ${receipt.amountText}`);
      doc.text(`Date: ${new Date(receipt.paidAt).toLocaleString()}`);
      doc.moveDown(2);

      // QR Code
      if (qrDataUrl) {
        const qrBuffer = Buffer.from(qrDataUrl.split(",")[1], "base64");
        doc.image(qrBuffer, { fit: [120, 120], align: 'center' });
        doc.moveDown();
        doc.fillColor('#666').fontSize(9).text('Scan QR to view online receipt', { align: 'center' });
      }

      // Footer
      doc.moveDown(2);
      doc.fillColor('#888').fontSize(9).text('Thank you for choosing TravelApp!', { align: 'center' });
      doc.text('For support, contact support@travelapp.com', { align: 'center' });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

async function sendReceiptEmail(user, receipt, receiptUrl, qrDataUrl) {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM } = process.env;
  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS) {
    return { sent: false, status: "skipped: SMTP is not configured" };
  }

  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure: Number(SMTP_PORT) === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });

  const qrBuffer = Buffer.from(qrDataUrl.split(",")[1], "base64");
  
  // Generate PDF
  let pdfBuffer = null;
  try {
    pdfBuffer = await generateReceiptPdf(receipt, qrDataUrl);
  } catch (err) {
    console.error("PDF generation error:", err);
  }

  const attachments = [
    { filename: `${receipt.receiptNumber}-qr.png`, content: qrBuffer, contentType: "image/png" },
  ];
  
  // Add PDF attachment if generated
  if (pdfBuffer) {
    attachments.push({ 
      filename: `${receipt.receiptNumber}.pdf`, 
      content: pdfBuffer, 
      contentType: "application/pdf" 
    });
  }

  await transporter.sendMail({
    from: SMTP_FROM || SMTP_USER,
    to: user.email,
    subject: `Your TravelApp receipt ${receipt.receiptNumber}`,
    html: receiptEmailHtml(receipt, receiptUrl),
    text: `Your payment is successful. Receipt: ${receiptUrl}. Total paid: ${receipt.amountText}. Payment ID: ${receipt.paymentId}.`,
    attachments,
  });

  return { sent: true, status: "sent" };
}

// ================================================================
//  AUTH ROUTES
// ================================================================
app.post("/api/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) return res.status(400).json({ message: "Fill all fields" });
    if (await User.findOne({ email })) return res.status(400).json({ message: "Email already registered" });
    const shouldBeAdmin = (await User.countDocuments()) === 0;
    const hashed = await bcrypt.hash(password, 10);
    const user   = await User.create({ name, email, password: hashed, role: shouldBeAdmin ? "admin" : "user" });
    const token  = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET || "mysecretkey123", { expiresIn: "7d" });
    res.status(201).json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password)))
      return res.status(400).json({ message: "Wrong email or password" });
    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET || "mysecretkey123", { expiresIn: "7d" });
    res.json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

app.get("/api/me", checkLogin, async (req, res) => {
  const user = await User.findById(req.userId).select("-password");
  res.json({ user });
});

// ================================================================
//  TRIP ROUTES
// ================================================================
app.get("/api/trips", checkLogin, async (req, res) => {
  const trips = await Trip.find({ userId: req.userId }).sort({ createdAt: -1 });
  res.json({ trips });
});
app.post("/api/trips", checkLogin, async (req, res) => {
  try {
    const trip = await Trip.create({ ...req.body, userId: req.userId });
    await Notification.create({ userId: req.userId, type: "trip_created", title: "Trip Created!", message: `Your trip "${trip.tripName}" to ${trip.destination} has been planned.`, data: { tripId: trip._id } });
    res.status(201).json({ trip });
  } catch (err) { res.status(400).json({ message: err.message }); }
});
app.delete("/api/trips/:id", checkLogin, async (req, res) => {
  await Trip.findOneAndDelete({ _id: req.params.id, userId: req.userId });
  res.json({ message: "Trip deleted" });
});

// ================================================================
//  HOTEL ROUTES
// ================================================================
const DEFAULT_HOTELS = [
  { name:"Taj Lake Palace",            location:"Udaipur, Rajasthan",     city:"Udaipur",     state:"Rajasthan",   description:"Iconic floating palace hotel on Lake Pichola",        price:25000, rating:4.9, category:"Luxury",   amenities:["Pool","Spa","WiFi","Restaurant","Butler"], rooms:83,  season:["Winter","All Year"] },
  { name:"Jaipur Heritage Haveli",     location:"Jaipur, Rajasthan",      city:"Jaipur",      state:"Rajasthan",   description:"Heritage stay close to Amer Fort and Hawa Mahal",      price:6200,  rating:4.5, category:"Standard", amenities:["WiFi","Restaurant","Breakfast","Heritage Walk"], rooms:45, season:["Winter"] },
  { name:"Rambagh Palace Jaipur",      location:"Bhawani Singh Road, Jaipur, Rajasthan", city:"Jaipur", state:"Rajasthan", description:"Royal palace stay with gardens, fine dining and classic Jaipur luxury", price:28000, rating:4.9, category:"Luxury", amenities:["Pool","Spa","WiFi","Restaurant","Heritage Tour"], rooms:78, season:["Winter","All Year"] },
  { name:"Arya Niwas Jaipur",          location:"Sansar Chandra Road, Jaipur, Rajasthan", city:"Jaipur", state:"Rajasthan", description:"Comfortable budget-friendly hotel near the old city markets and monuments", price:2600, rating:4.3, category:"Budget", amenities:["WiFi","Restaurant","Breakfast","Garden"], rooms:90, season:["Winter","All Year"] },
  { name:"Pearl Palace Heritage",      location:"Gopalbari, Jaipur, Rajasthan", city:"Jaipur", state:"Rajasthan", description:"Boutique heritage hotel with colorful rooms and easy access to Jaipur sights", price:5200, rating:4.6, category:"Standard", amenities:["WiFi","Restaurant","Breakfast","Airport Pickup"], rooms:32, season:["Winter","All Year"] },
  { name:"Jaisalmer Desert Camp",      location:"Jaisalmer, Rajasthan",   city:"Jaisalmer",   state:"Rajasthan",   description:"Desert camp near Sam Sand Dunes with camel safari",    price:4800,  rating:4.4, category:"Standard", amenities:["Restaurant","Bonfire","Camel Safari","WiFi"], rooms:35, season:["Winter"] },
  { name:"The Leela Palace",           location:"New Delhi",              city:"New Delhi",   state:"Delhi",       description:"Ultra-luxury 5-star in the heart of Delhi",            price:18000, rating:4.8, category:"Luxury",   amenities:["Pool","Spa","WiFi","Gym","Restaurant"],    rooms:254, season:["Winter","All Year"] },
  { name:"Kumarakom Lake Resort",      location:"Kumarakom, Kerala",      city:"Kumarakom",   state:"Kerala",      description:"Backwater resort with traditional Kerala charm",       price:12000, rating:4.7, category:"Luxury",   amenities:["Pool","Spa","WiFi","Ayurveda","Boating"],  rooms:50,  season:["Winter","Summer"] },
  { name:"Alleppey Backwater Retreat", location:"Alleppey, Kerala Backwaters", city:"Alleppey", state:"Kerala",    description:"Canal-side resort for houseboat stays and backwater views", price:6500, rating:4.5, category:"Standard", amenities:["WiFi","Houseboat","Restaurant","Ayurveda"], rooms:42, season:["Winter"] },
  { name:"Munnar Tea Valley Resort",   location:"Munnar, Kerala",         city:"Munnar",      state:"Kerala",      description:"Hill resort surrounded by tea gardens and waterfalls", price:5200,  rating:4.4, category:"Standard", amenities:["WiFi","Restaurant","Tea Tours","Garden"], rooms:55, season:["Winter","Summer"] },
  { name:"Periyar Jungle Lodge",       location:"Thekkady, Periyar, Kerala", city:"Thekkady", state:"Kerala",      description:"Forest-side stay for Periyar Wildlife Sanctuary, spice walks and boating", price:4800, rating:4.3, category:"Standard", amenities:["WiFi","Restaurant","Safari Desk","Breakfast"], rooms:36, season:["Winter","Summer"] },
  { name:"Kovalam Beach Resort",       location:"Kovalam Beach, Kerala",   city:"Kovalam",    state:"Kerala",      description:"Beach stay near Kovalam's lighthouse beach and coastal cafes", price:7200, rating:4.4, category:"Standard", amenities:["Beach","Pool","WiFi","Restaurant"], rooms:64, season:["Winter","Summer"] },
  { name:"Wildflower Hall",            location:"Shimla, Himachal Pradesh",city:"Shimla",     state:"Himachal Pradesh",description:"Colonial-era luxury on Himalayas",               price:15000, rating:4.8, category:"Luxury",   amenities:["Spa","WiFi","Restaurant","Trekking"],      rooms:85,  season:["Summer","Winter"] },
  { name:"Spiti Monastery View Stay",  location:"Kaza, Spiti Valley, Himachal Pradesh", city:"Spiti Valley", state:"Himachal Pradesh", description:"Mountain stay for monasteries, Chandratal and high passes", price:2800, rating:4.2, category:"Budget", amenities:["WiFi","Restaurant","Trekking","Bonfire"], rooms:24, season:["Summer"] },
  { name:"Key Monastery Retreat",      location:"Key Monastery Road, Kaza, Spiti Valley, Himachal Pradesh", city:"Kaza", state:"Himachal Pradesh", description:"Simple mountain retreat close to Key Monastery and Spiti viewpoints", price:3200, rating:4.4, category:"Budget", amenities:["WiFi","Restaurant","Mountain View","Parking"], rooms:18, season:["Summer"] },
  { name:"Kaza Valley Hotel",          location:"Main Market, Kaza, Spiti Valley, Himachal Pradesh", city:"Kaza", state:"Himachal Pradesh", description:"Comfortable hotel in Kaza for Key Monastery, Kibber and local Spiti routes", price:4200, rating:4.3, category:"Standard", amenities:["WiFi","Restaurant","Heater","Travel Desk"], rooms:30, season:["Summer"] },
  { name:"Chandratal Lake Camp",       location:"Chandratal Road, Spiti Valley, Himachal Pradesh", city:"Spiti Valley", state:"Himachal Pradesh", description:"Seasonal camp for Chandratal Lake, Kunzum Pass and high-altitude night stays", price:3800, rating:4.1, category:"Budget", amenities:["Meals","Bonfire","Guided Trek","Parking"], rooms:20, season:["Summer"] },
  { name:"Pin Valley Homestay",        location:"Mud Village, Pin Valley, Spiti Valley, Himachal Pradesh", city:"Pin Valley", state:"Himachal Pradesh", description:"Local homestay near Pin Valley National Park and village walks", price:2400, rating:4.2, category:"Budget", amenities:["Meals","Local Guide","Mountain View","Parking"], rooms:12, season:["Summer"] },
  { name:"Kunzum Pass Lodge",          location:"Losar, Kunzum Pass, Spiti Valley, Himachal Pradesh", city:"Losar", state:"Himachal Pradesh", description:"Basic high-altitude lodge for Kunzum Pass routes and road-trip stopovers", price:2600, rating:4.0, category:"Budget", amenities:["Meals","Parking","Travel Desk","Bonfire"], rooms:16, season:["Summer"] },
  { name:"Umaid Bhawan Palace",        location:"Jodhpur, Rajasthan",     city:"Jodhpur",    state:"Rajasthan",   description:"Heritage palace hotel still home to royal family",    price:30000, rating:4.9, category:"Luxury",   amenities:["Pool","Spa","WiFi","Museum","Tennis"],     rooms:70,  season:["Winter","All Year"] },
  { name:"ITC Grand Chola",            location:"Chennai, Tamil Nadu",    city:"Chennai",    state:"Tamil Nadu",  description:"Grand luxury hotel inspired by Chola dynasty",        price:9000,  rating:4.7, category:"Luxury",   amenities:["Pool","Spa","WiFi","Multiple Restaurants"],rooms:522, season:["All Year"] },
  { name:"Ooty Lake View Hotel",       location:"Ooty, Tamil Nadu",       city:"Ooty",        state:"Tamil Nadu",  description:"Comfortable hill hotel near Ooty Lake and gardens",    price:4200,  rating:4.2, category:"Standard", amenities:["WiFi","Restaurant","Garden","Breakfast"], rooms:48, season:["Summer"] },
  { name:"Goa Marriott Resort",        location:"Panaji, Goa",            city:"Panaji",     state:"Goa",         description:"Beachfront luxury with stunning Mandovi river views",  price:8000,  rating:4.5, category:"Luxury",   amenities:["Pool","Beach","WiFi","Spa","Bar"],          rooms:180, season:["Winter","Summer"] },
  { name:"Taj Cidade de Goa Horizon",  location:"Panaji, Goa",            city:"Panaji",     state:"Goa",         description:"Luxury seaside stay near Goa's beaches and old quarter",price:11000, rating:4.6, category:"Luxury",   amenities:["Pool","Beach","WiFi","Spa","Restaurant"],  rooms:299, season:["Winter","Summer"] },
  { name:"SeaShell Havelock",          location:"Havelock Island, Andaman & Nicobar", city:"Havelock Island", state:"Andaman & Nicobar", description:"Island resort close to turquoise beaches and scuba spots", price:9500, rating:4.6, category:"Luxury", amenities:["Beach","WiFi","Restaurant","Scuba","Bar"], rooms:40, season:["Winter","Summer"] },
  { name:"Hotel Sentinel",             location:"Port Blair, Andaman & Nicobar", city:"Port Blair", state:"Andaman & Nicobar", description:"Comfortable city hotel for Cellular Jail and island hopping", price:5500, rating:4.2, category:"Standard", amenities:["Pool","WiFi","Restaurant","Breakfast"], rooms:50, season:["Winter","Summer"] },
  { name:"The Park Hotel",             location:"Bangalore, Karnataka",   city:"Bangalore",  state:"Karnataka",   description:"Trendy design hotel in Bengaluru city center",         price:6000,  rating:4.3, category:"Standard", amenities:["Pool","WiFi","Restaurant","Gym"],           rooms:109, season:["All Year"] },
  { name:"Coorg Coffee Estate Stay",   location:"Coorg, Karnataka",       city:"Coorg",       state:"Karnataka",   description:"Plantation stay with misty valley and coffee estate views", price:5000, rating:4.4, category:"Standard", amenities:["WiFi","Restaurant","Coffee Tour","Garden"], rooms:32, season:["Summer","Monsoon"] },
  { name:"Mangalore Coastal Comfort",   location:"Mangalore, Karnataka",   city:"Mangalore",   state:"Karnataka",   description:"Coastal city hotel close to beaches, seafood spots and temple routes", price:4200, rating:4.3, category:"Standard", amenities:["WiFi","Restaurant","Breakfast","Parking"], rooms:48, season:["Winter","Summer","Monsoon"] },
  { name:"Panambur Beachfront Inn",     location:"Panambur Beach, Mangalore, Karnataka", city:"Mangalore", state:"Karnataka", description:"Beachside hotel near Panambur Beach with easy access to sunset walks and water activities", price:3800, rating:4.2, category:"Standard", amenities:["Beach","WiFi","Restaurant","Breakfast"], rooms:34, season:["Winter","Summer","Monsoon"] },
  { name:"Tannirbhavi River View Stay", location:"Tannirbhavi Beach, Mangalore, Karnataka", city:"Mangalore", state:"Karnataka", description:"Quiet coastal stay near Tannirbhavi Beach, ferry routes and relaxed seaside viewpoints", price:4600, rating:4.4, category:"Standard", amenities:["Beach","WiFi","Restaurant","Parking"], rooms:28, season:["Winter","Summer","Monsoon"] },
  { name:"Kudroli Temple Residency",    location:"Kudroli, Mangalore, Karnataka", city:"Mangalore", state:"Karnataka", description:"Central hotel close to Kudroli Gokarnath Temple, city markets and temple sightseeing routes", price:3200, rating:4.1, category:"Budget", amenities:["WiFi","Breakfast","Restaurant","Parking"], rooms:40, season:["All Year"] },
  { name:"Hampankatta Heritage Hotel",  location:"Hampankatta, Mangalore, Karnataka", city:"Mangalore", state:"Karnataka", description:"City hotel near St. Aloysius Chapel, old Mangalore heritage streets and shopping areas", price:3900, rating:4.2, category:"Standard", amenities:["WiFi","Restaurant","Breakfast","Travel Desk"], rooms:52, season:["All Year"] },
  { name:"Boloor Riverside Retreat",    location:"Boloor, Mangalore, Karnataka", city:"Mangalore", state:"Karnataka", description:"Riverside stay near Sultan Battery, boat routes and quiet evening viewpoints", price:4400, rating:4.3, category:"Standard", amenities:["River View","WiFi","Restaurant","Parking"], rooms:30, season:["Winter","Summer","Monsoon"] },
  { name:"Chikmagalur Coffee Estate Resort", location:"Chikmagalur, Karnataka", city:"Chikmagalur", state:"Karnataka", description:"Coffee estate stay with hill views, waterfalls and relaxed plantation walks", price:5600, rating:4.5, category:"Standard", amenities:["WiFi","Restaurant","Coffee Tour","Bonfire","Garden"], rooms:36, season:["Summer","Monsoon","Winter"] },
  { name:"Chikmagalur Budget Homestay", location:"Chikmagalur, Karnataka", city:"Chikmagalur", state:"Karnataka", description:"Affordable homestay for Mullayanagiri, Baba Budangiri and coffee country sightseeing", price:2400, rating:4.2, category:"Budget", amenities:["WiFi","Breakfast","Local Guide","Parking"], rooms:18, season:["Summer","Monsoon","Winter"] },
  { name:"Mullayanagiri Hill View Lodge", location:"Mullayanagiri Road, Chikmagalur, Karnataka", city:"Chikmagalur", state:"Karnataka", description:"Hill-view lodge for Mullayanagiri peak drives, sunrise viewpoints and trekking plans", price:4800, rating:4.4, category:"Standard", amenities:["Mountain View","WiFi","Restaurant","Travel Desk"], rooms:26, season:["Summer","Monsoon","Winter"] },
  { name:"Baba Budangiri Mountain Camp", location:"Baba Budangiri, Chikmagalur, Karnataka", city:"Chikmagalur", state:"Karnataka", description:"Mountain camp close to Baba Budangiri viewpoints, caves and scenic Western Ghats roads", price:3600, rating:4.1, category:"Budget", amenities:["Meals","Bonfire","Local Guide","Parking"], rooms:20, season:["Summer","Monsoon","Winter"] },
  { name:"Kemmanagundi Falls Retreat",  location:"Kemmanagundi, Chikmagalur, Karnataka", city:"Chikmagalur", state:"Karnataka", description:"Nature retreat for Hebbe Falls, Kemmanagundi routes and forest-side sightseeing", price:5200, rating:4.3, category:"Standard", amenities:["WiFi","Restaurant","Nature Walk","Parking"], rooms:24, season:["Summer","Monsoon","Winter"] },
  { name:"Hirekolale Lake View Resort", location:"Hirekolale Lake, Chikmagalur, Karnataka", city:"Chikmagalur", state:"Karnataka", description:"Lake-view stay near Hirekolale sunset point and quiet Chikmagalur countryside drives", price:6200, rating:4.5, category:"Luxury", amenities:["Lake View","WiFi","Restaurant","Pool"], rooms:22, season:["Summer","Monsoon","Winter"] },
  { name:"Mysore Palace Residency",    location:"Mysore, Karnataka",      city:"Mysore",      state:"Karnataka",   description:"City hotel close to Mysore Palace and Devaraja Market", price:3600, rating:4.2, category:"Standard", amenities:["WiFi","Restaurant","Breakfast","Parking"], rooms:64, season:["Winter","Summer"] },
  { name:"Hampi Heritage Resort",      location:"Hampi, Karnataka",       city:"Hampi",       state:"Karnataka",   description:"Heritage stay near Hampi ruins and boulder landscapes", price:3900, rating:4.3, category:"Standard", amenities:["WiFi","Restaurant","Bicycle Rental","Garden"], rooms:38, season:["Winter"] },
  { name:"Sterling Yercaud",           location:"Yercaud, Tamil Nadu",    city:"Yercaud",    state:"Tamil Nadu",  description:"Serene hill resort in the Shevaroy Hills",            price:4500,  rating:4.2, category:"Standard", amenities:["WiFi","Restaurant","Garden","Trekking"],   rooms:60,  season:["Summer","Monsoon"] },
  { name:"Hotel Polo Towers",          location:"Shillong, Meghalaya",    city:"Shillong",   state:"Meghalaya",   description:"Premier business hotel in Scotland of the East",       price:3500,  rating:4.1, category:"Standard", amenities:["WiFi","Restaurant","Conference"],           rooms:97,  season:["Summer","All Year"] },
  { name:"Budget Inn Varanasi",        location:"Varanasi, UP",           city:"Varanasi",   state:"Uttar Pradesh",description:"Clean and comfortable stay near ghats",              price:1200,  rating:3.9, category:"Budget",   amenities:["WiFi","Breakfast"],                        rooms:40,  season:["Winter","All Year"] },
  { name:"Agra Taj View Hotel",        location:"Agra, Uttar Pradesh",     city:"Agra",       state:"Uttar Pradesh",description:"Hotel near Taj Mahal with rooftop monument views",     price:4500,  rating:4.4, category:"Standard", amenities:["WiFi","Restaurant","Rooftop","Breakfast"], rooms:58, season:["Winter"] },
  { name:"Zostel Manali",              location:"Manali, HP",             city:"Manali",     state:"Himachal Pradesh",description:"Popular backpacker hostel in Himalayan town",      price:800,   rating:4.0, category:"Budget",   amenities:["WiFi","Common Kitchen","Bonfire"],          rooms:20,  season:["Summer"] },
  { name:"Rishikesh Budget Rooms",     location:"Rishikesh, Uttarakhand", city:"Rishikesh",  state:"Uttarakhand", description:"Budget rooms near the famous rafting ghats",           price:999,   rating:3.8, category:"Budget",   amenities:["WiFi","Breakfast"],                        rooms:30,  season:["Summer","Winter"] },
  { name:"Corbett Jungle Lodge",       location:"Jim Corbett, Uttarakhand",city:"Jim Corbett",state:"Uttarakhand", description:"Wildlife lodge near safari gates and forest trails",    price:6200,  rating:4.5, category:"Standard", amenities:["Safari","Restaurant","Pool","Bonfire"], rooms:36, season:["Winter","Summer"] },
  { name:"Hotel Sea Princess",         location:"Mumbai, Maharashtra",    city:"Mumbai",     state:"Maharashtra", description:"Seafacing hotel in Juhu near Bollywood hub",           price:7000,  rating:4.2, category:"Standard", amenities:["Pool","WiFi","Restaurant","Gym"],           rooms:80,  season:["All Year"] },
  { name:"Treehouse Hideaway",         location:"Bandhavgarh, MP",        city:"Bandhavgarh",state:"Madhya Pradesh",description:"Eco resort near tiger reserve forest",              price:5500,  rating:4.4, category:"Standard", amenities:["WiFi","Safari","Restaurant","Bonfire"],    rooms:12,  season:["Winter","Summer"] },
  { name:"Khajuraho Temple View Hotel",location:"Khajuraho, Madhya Pradesh",city:"Khajuraho", state:"Madhya Pradesh",description:"Comfortable stay near the Western Temple Group",     price:3200,  rating:4.2, category:"Standard", amenities:["WiFi","Restaurant","Breakfast","Guide Desk"], rooms:44, season:["Winter"] },
  { name:"Darjeeling Tea Garden Inn",  location:"Darjeeling, West Bengal", city:"Darjeeling", state:"West Bengal", description:"Hill stay with tea garden views and toy train access",  price:4200,  rating:4.3, category:"Standard", amenities:["WiFi","Restaurant","Tea Tours","Breakfast"], rooms:40, season:["Summer","Monsoon"] },
  { name:"Kolkata Heritage Grand",     location:"Kolkata, West Bengal",   city:"Kolkata",    state:"West Bengal", description:"Classic city hotel near Victoria Memorial and Park Street", price:5200, rating:4.3, category:"Standard", amenities:["WiFi","Restaurant","Gym","Breakfast"], rooms:90, season:["Winter"] },
  { name:"Leh Himalayan Retreat",      location:"Leh Ladakh, Ladakh",     city:"Leh Ladakh",  state:"Ladakh",      description:"High-altitude stay close to monasteries and market",   price:5800,  rating:4.5, category:"Standard", amenities:["WiFi","Restaurant","Oxygen Support","Tours"], rooms:34, season:["Summer"] },
  { name:"Amritsar Golden Stay",       location:"Amritsar, Punjab",       city:"Amritsar",    state:"Punjab",     description:"Hotel near Golden Temple and heritage food streets",   price:2800,  rating:4.2, category:"Budget",   amenities:["WiFi","Breakfast","Restaurant","Parking"], rooms:52, season:["Winter","Summer"] },
  { name:"Kutch White Rann Resort",    location:"Rann of Kutch, Gujarat", city:"Rann of Kutch", state:"Gujarat",  description:"Tent resort for White Rann views and cultural evenings", price:5600, rating:4.4, category:"Standard", amenities:["Restaurant","Cultural Show","WiFi","Tours"], rooms:45, season:["Winter"] },
  { name:"Puri Beach Retreat",         location:"Puri, Odisha",           city:"Puri",        state:"Odisha",      description:"Beach hotel near Jagannath Temple and golden sands",    price:3500,  rating:4.2, category:"Standard", amenities:["Beach","WiFi","Restaurant","Breakfast"], rooms:60, season:["Winter"] },
];

const INDIA_HOTEL_STATES = [
  "Rajasthan", "Delhi", "Kerala", "Himachal Pradesh", "Tamil Nadu",
  "Goa", "Karnataka", "Meghalaya", "Uttar Pradesh", "Uttarakhand",
  "Maharashtra", "Madhya Pradesh", "Andaman & Nicobar", "West Bengal",
  "Ladakh", "Punjab", "Gujarat", "Odisha",
];

function includesPlace(text, value = "") {
  return text.includes(String(value).toLowerCase());
}

function searchTermsForPlace(search = "") {
  const term = String(search || "").trim();
  if (!term) return [];

  const terms = [term];
  const lower = term.toLowerCase();
  if (lower.includes("manglore")) terms.push("Mangalore");
  if (lower.includes("chikka manglore") || lower.includes("chickmagalur") || lower.includes("chikmagaluru")) {
    terms.push("Chikmagalur");
  }
  return [...new Set(terms)];
}

function roomOptionsForHotel(hotel) {
  const totalRooms = Number(hotel.rooms || 10);
  const basePrice = Number(hotel.price || 0);
  const isLuxury = hotel.category === "Luxury";
  const isBudget = hotel.category === "Budget";
  const options = [
    {
      id: "classic",
      type: isBudget ? "Budget Room" : "Classic Room",
      view: "City view",
      sleeps: 2,
      available: Math.max(1, Math.floor(totalRooms * 0.45)),
      price: Math.max(1, Math.round(basePrice * (isLuxury ? 0.9 : 1))),
      perks: ["WiFi", "Breakfast"],
    },
    {
      id: "deluxe",
      type: "Deluxe Room",
      view: isLuxury ? "Lake or garden view" : "Garden view",
      sleeps: 3,
      available: Math.max(1, Math.floor(totalRooms * 0.3)),
      price: Math.max(1, Math.round(basePrice * (isBudget ? 1.25 : 1.2))),
      perks: ["WiFi", "Breakfast", "Work desk"],
    },
    {
      id: "suite",
      type: isLuxury ? "Palace Suite" : "Family Suite",
      view: isLuxury ? "Premium view" : "Balcony view",
      sleeps: 4,
      available: Math.max(1, Math.floor(totalRooms * 0.15)),
      price: Math.max(1, Math.round(basePrice * (isLuxury ? 1.8 : 1.55))),
      perks: ["WiFi", "Breakfast", "Extra space"],
    },
  ];

  if (!isBudget) {
    options.push({
      id: "premium",
      type: isLuxury ? "Royal Suite" : "Premium Room",
      view: isLuxury ? "Best property view" : "Pool view",
      sleeps: 4,
      available: Math.max(1, Math.floor(totalRooms * 0.1)),
      price: Math.max(1, Math.round(basePrice * (isLuxury ? 2.4 : 1.8))),
      perks: ["WiFi", "Breakfast", "Lounge access"],
    });
  }

  return options;
}

async function ensureIndiaHotels() {
  await Hotel.updateMany(
    { name: "OYO Rooms Rishikesh" },
    { $set: { name: "Rishikesh Budget Rooms" } },
  );
  const existingNames = await Hotel.find({
    name: { $in: DEFAULT_HOTELS.map(h => h.name) },
  }).select("name");
  const existing = new Set(existingNames.map(h => h.name));
  const missing = DEFAULT_HOTELS.filter(h => !existing.has(h.name));
  if (missing.length > 0) await Hotel.insertMany(missing);
}

async function ensureIndiaDestinations() {
  const existingNames = await IndiaDest.find({
    name: { $in: INDIA_DESTINATIONS.map(d => d.name) },
  }).select("name");
  const existing = new Set(existingNames.map(d => d.name));
  const missing = INDIA_DESTINATIONS.filter(d => !existing.has(d.name));
  if (missing.length > 0) await IndiaDest.insertMany(missing);
}

app.get("/api/hotels", async (req, res) => {
  try {
    const { search, category, minPrice, maxPrice, city, state, season } = req.query;
    await ensureIndiaHotels();

    let query = { state: { $in: INDIA_HOTEL_STATES } };
    if (search) {
      const searchTerms = searchTermsForPlace(search);
      query.$or = searchTerms.flatMap(term => [
        { name:{ $regex:term,$options:"i" }},
        { location:{ $regex:term,$options:"i" }},
        { city:{ $regex:term,$options:"i" }},
        { state:{ $regex:term,$options:"i" }},
      ]);
    }
    if (category && category !== "All") query.category = category;
    if (city)     query.city  = { $regex: city,  $options: "i" };
    if (state)    query.state = { $regex: state, $options: "i" };
    if (season && season !== "All") query.season = { $in: [season, "All Year"] };
    if (minPrice) query.price = { ...query.price, $gte: Number(minPrice) };
    if (maxPrice) query.price = { ...query.price, $lte: Number(maxPrice) };

    const hotels = await Hotel.find(query).sort({ rating: -1 });
    res.json({ hotels });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

app.get("/api/hotels/:id", async (req, res) => {
  try {
    const hotel = await Hotel.findById(req.params.id);
    if (!hotel) return res.status(404).json({ message: "Hotel not found" });
    res.json({ hotel: { ...hotel.toObject(), roomOptions: roomOptionsForHotel(hotel) } });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

app.post("/api/hotels", checkLogin, checkAdmin, async (req, res) => {
  try {
    const data = { ...req.body };
    if (data.price)     data.price  = Number(data.price);
    if (data.rooms)     data.rooms  = Number(data.rooms);
    if (data.rating)    data.rating = Number(data.rating);
    if (data.amenities && typeof data.amenities === "string") data.amenities = data.amenities.split(",").map(a => a.trim());
    if (data.season    && typeof data.season    === "string") data.season    = data.season.split(",").map(s => s.trim());
    const hotel = await Hotel.create(data);
    res.status(201).json({ hotel });
  } catch (err) { res.status(400).json({ message: err.message }); }
});

app.put("/api/hotels/:id",    checkLogin, checkAdmin, async (req, res) => { const hotel = await Hotel.findByIdAndUpdate(req.params.id, req.body, { new:true }); res.json({ hotel }); });
app.delete("/api/hotels/:id", checkLogin, checkAdmin, async (req, res) => { await Hotel.findByIdAndDelete(req.params.id); res.json({ message:"Hotel deleted" }); });

// ================================================================
//  BOOKING ROUTES
// ================================================================
app.get("/api/bookings", checkLogin, async (req, res) => {
  const bookings = await Booking.find({ userId: req.userId }).sort({ createdAt: -1 });
  res.json({ bookings });
});

app.post("/api/bookings", checkLogin, async (req, res) => {
  try {
    const { hotelId, checkIn, checkOut, guests, roomId, roomsBooked } = req.body;
    const hotel  = await Hotel.findById(hotelId);
    if (!hotel) return res.status(404).json({ message: "Hotel not found" });
    const roomOptions = roomOptionsForHotel(hotel);
    const selectedRoom = roomOptions.find(room => room.id === roomId) || roomOptions[0];
    const bookedRooms = Math.max(1, Number(roomsBooked || 1));
    if (bookedRooms > selectedRoom.available) return res.status(400).json({ message: "Not enough rooms available" });
    const nights     = Math.max(1, Math.ceil((new Date(checkOut) - new Date(checkIn)) / 86400000));
    const totalPrice = nights * selectedRoom.price * bookedRooms;
    const booking    = await Booking.create({
      userId:req.userId,
      hotelId,
      hotelName:hotel.name,
      checkIn,
      checkOut,
      guests:Number(guests||1),
      totalPrice,
      nights,
      roomType:selectedRoom.type,
      roomView:selectedRoom.view,
      roomPrice:selectedRoom.price,
      roomsBooked:bookedRooms,
      roomNumbers:assignRoomNumbers(selectedRoom.id, bookedRooms),
    });
    await Notification.create({ userId:req.userId, type:"booking_confirmed", title:"🏨 Booking Confirmed!", message:`Your booking at ${hotel.name} (${checkIn} to ${checkOut}) is confirmed!`, data:{ bookingId:booking._id } });
    res.status(201).json({ booking });
  } catch (err) { res.status(400).json({ message: err.message }); }
});

app.post("/api/transport-bookings", checkLogin, async (req, res) => {
  try {
    const { transportMode, source, destination, travelDate, passengers, seatClass, provider, totalPrice, seatType, seatNumber, seatPrice, seatsBooked } = req.body;
    if (!transportMode || !source || !destination || !travelDate) {
      return res.status(400).json({ message: "Fill all transport booking fields" });
    }
    if (source === destination) return res.status(400).json({ message: "Source and destination cannot be same" });

    const booking = await Booking.create({
      bookingType: "transport",
      userId: req.userId,
      transportMode,
      source,
      destination,
      travelDate,
      passengers: Number(passengers || 1),
      seatClass,
      provider,
      seatType,
      seatNumber,
      seatPrice: Number(seatPrice || 0),
      seatsBooked: Number(seatsBooked || passengers || 1),
      totalPrice: Number(totalPrice || 0),
    });
    await Notification.create({
      userId: req.userId,
      type: "booking_confirmed",
      title: "🎫 Transport Booking Confirmed!",
      message: `${transportMode} booking from ${source} to ${destination} on ${travelDate} is confirmed. Complete payment to finalize your ticket.`,
      data: { bookingId: booking._id },
    });
    res.status(201).json({ booking });
  } catch (err) { res.status(400).json({ message: err.message }); }
});

// CANCEL BOOKING — sends notification
app.put("/api/bookings/:id/cancel", checkLogin, async (req, res) => {
  try {
    const booking = await Booking.findOne({ _id: req.params.id, userId: req.userId });
    if (!booking)             return res.status(404).json({ message: "Booking not found" });
    if (booking.status === "cancelled") return res.status(400).json({ message: "Already cancelled" });

    booking.status       = "cancelled";
    booking.cancelledAt  = new Date();
    booking.cancelReason = req.body.reason || "User requested cancellation";
    booking.paymentStatus = "refund_pending";
    await booking.save();

    // Create cancellation notification
    await Notification.create({
      userId:  req.userId,
      type:    "booking_cancelled",
      title:   "❌ Booking Cancelled",
      message: `Your booking at ${booking.hotelName} has been cancelled. Refund of ₹${booking.totalPrice?.toLocaleString()} will be processed in 5-7 days.`,
      data:    { bookingId: booking._id, refundAmount: booking.totalPrice },
    });

    res.json({ booking, message: "Booking cancelled. Refund notification sent." });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

app.delete("/api/bookings/:id", checkLogin, async (req, res) => {
  try {
    const deleted = await Booking.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    if (!deleted) return res.status(404).json({ message: "Booking not found" });
    res.json({ message: "Booking deleted" });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ================================================================
//  PAYMENT
// ================================================================
app.post("/api/payment/razorpay/order", checkLogin, async (req, res) => {
  try {
    console.log("=== RAZORPAY ORDER REQUEST ===");
    console.log("Razorpay configured:", !!razorpay);
    console.log("Key ID present:", !!process.env.RAZORPAY_KEY_ID);
    console.log("Key Secret present:", !!process.env.RAZORPAY_KEY_SECRET);
    
    if (!razorpay) return res.status(500).json({ message: "Razorpay is not configured" });

    const { bookingId } = req.body;
    console.log("Booking ID:", bookingId);
    console.log("User ID:", req.userId);
    
    const booking = await Booking.findOne({ _id: bookingId, userId: req.userId });
    if (!booking) return res.status(404).json({ message: "Booking not found" });
    if (booking.status === "cancelled") return res.status(400).json({ message: "Cannot pay for a cancelled booking" });
    if (booking.paymentStatus === "paid") return res.status(400).json({ message: "Booking already paid" });

    const amount = Math.round(Number(booking.totalPrice || 0) * 100);
    console.log("Amount (paise):", amount);
    if (amount <= 0) return res.status(400).json({ message: "Invalid payment amount" });

    console.log("Creating Razorpay order...");
    const order = await razorpay.orders.create({
      amount,
      currency: "INR",
      receipt: `booking_${booking._id}`.slice(0, 40),
      notes: {
        bookingId: String(booking._id),
        userId: String(req.userId),
      },
    });
    console.log("Order created successfully:", order.id);

    res.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      key: process.env.RAZORPAY_KEY_ID,
      booking,
    });
  } catch (err) { 
    console.error("Razorpay order error:", err);
    res.status(500).json({ message: err.message }); 
  }
});

app.post("/api/payment/razorpay/verify", checkLogin, async (req, res) => {
  try {
    const { bookingId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ message: "Missing Razorpay payment details" });
    }

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || "")
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ message: "Payment verification failed" });
    }

    const receiptNumber = `RCPT-${new Date().getFullYear()}-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;
    const receiptUrl = `${frontendBaseUrl()}/receipt/${razorpay_payment_id}`;
    const receiptQrCode = await QRCode.toDataURL(receiptUrl, { margin: 1, width: 260 });
    const booking = await Booking.findOneAndUpdate(
      { _id: bookingId, userId: req.userId },
      {
        paymentStatus: "paid",
        paymentId: razorpay_payment_id,
        razorpayOrderId: razorpay_order_id,
        receiptNumber,
        receiptUrl,
        receiptQrCode,
      },
      { new: true }
    );
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    const user = await User.findById(req.userId).select("name email");
    const hotel = booking.hotelId ? await Hotel.findById(booking.hotelId).select("location city state") : null;
    const receipt = receiptDetails(booking, user, hotel);
    let emailResult;
    try {
      emailResult = await sendReceiptEmail(user, receipt, receiptUrl, receiptQrCode);
      booking.receiptEmailStatus = emailResult.status;
      if (emailResult.sent) booking.receiptEmailedAt = new Date();
      await booking.save();
    } catch (mailErr) {
      emailResult = { sent: false, status: `failed: ${mailErr.message}` };
      booking.receiptEmailStatus = emailResult.status;
      await booking.save();
    }

    const bookingLabel = booking.bookingType === "transport"
      ? `${booking.transportMode} ticket ${booking.source} to ${booking.destination}`
      : booking.hotelName;

    await Notification.create({
      userId:req.userId,
      type:"payment_success",
      title:"Payment Successful!",
      message:`Payment of Rs ${booking.totalPrice?.toLocaleString()} for ${bookingLabel} received. Receipt ${receiptNumber} is ready.`,
      data:{ bookingId, paymentId: razorpay_payment_id, orderId: razorpay_order_id, receiptUrl },
    });

    res.json({ message:"Payment successful", booking, receipt, receiptUrl, qrCodeDataUrl: receiptQrCode, emailStatus: emailResult.status });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

app.get("/api/receipts/:paymentId", async (req, res) => {
  try {
    const booking = await Booking.findOne({ paymentId: req.params.paymentId, paymentStatus: "paid" });
    if (!booking) return res.status(404).json({ message: "Receipt not found" });
    const user = await User.findById(booking.userId).select("name email");
    const hotel = booking.hotelId ? await Hotel.findById(booking.hotelId).select("location city state") : null;
    res.json({
      receipt: receiptDetails(booking, user, hotel),
      receiptUrl: booking.receiptUrl || `${frontendBaseUrl()}/receipt/${booking.paymentId}`,
      qrCodeDataUrl: booking.receiptQrCode,
    });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Download PDF Receipt
app.get("/api/receipts/:paymentId/pdf", async (req, res) => {
  try {
    const booking = await Booking.findOne({ paymentId: req.params.paymentId, paymentStatus: "paid" });
    if (!booking) return res.status(404).json({ message: "Receipt not found" });
    
    const user = await User.findById(booking.userId).select("name email");
    const hotel = booking.hotelId ? await Hotel.findById(booking.hotelId).select("location city state") : null;
    const receipt = receiptDetails(booking, user, hotel);
    
    const pdfBuffer = await generateReceiptPdf(receipt, booking.receiptQrCode);
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${receipt.receiptNumber}.pdf"`);
    res.send(pdfBuffer);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

app.post("/api/payment/simulate", checkLogin, async (req, res) => {
  try {
    const { bookingId } = req.body;
    const booking = await Booking.findByIdAndUpdate(bookingId, { paymentStatus:"paid", paymentId:"SIM_"+Date.now() }, { new:true });
    const bookingLabel = booking?.bookingType === "transport"
      ? `${booking.transportMode} ticket ${booking.source} to ${booking.destination}`
      : booking?.hotelName;
    await Notification.create({ userId:req.userId, type:"payment_success", title:"💳 Payment Successful!", message:`Payment of ₹${booking?.totalPrice?.toLocaleString()} for ${bookingLabel} received. Enjoy your trip!`, data:{ bookingId } });
    res.json({ message:"Payment successful" });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ================================================================
//  NOTIFICATIONS
// ================================================================
app.get("/api/notifications", checkLogin, async (req, res) => {
  const notifications = await Notification.find({ userId: req.userId }).sort({ createdAt: -1 }).limit(50);
  const unreadCount   = await Notification.countDocuments({ userId: req.userId, read: false });
  res.json({ notifications, unreadCount });
});

app.put("/api/notifications/mark-read", checkLogin, async (req, res) => {
  await Notification.updateMany({ userId: req.userId, read: false }, { $set: { read: true } });
  res.json({ message: "All marked as read" });
});

app.put("/api/notifications/:id/read", checkLogin, async (req, res) => {
  await Notification.findByIdAndUpdate(req.params.id, { read: true });
  res.json({ message: "Marked as read" });
});

app.delete("/api/notifications/:id", checkLogin, async (req, res) => {
  await Notification.findByIdAndDelete(req.params.id);
  res.json({ message: "Deleted" });
});

// ================================================================
//  INDIA DESTINATIONS
// ================================================================
const INDIA_DESTINATIONS = [
  { name:"Goa",             state:"Goa",               bestSeason:["Winter","Summer"],  category:"Beach",     lat:15.2993, lng:74.1240, description:"India's beach paradise with golden sands, vibrant nightlife and Portuguese heritage.", topAttractions:["Baga Beach","Dudhsagar Falls","Old Goa Churches","Anjuna Flea Market"], avgBudgetPerDay:2500, rating:4.6 },
  { name:"Manali",          state:"Himachal Pradesh",  bestSeason:["Summer","Winter"],  category:"Mountain",  lat:32.2396, lng:77.1887, description:"Himalayan adventure hub with snow peaks, apple orchards and ancient temples.", topAttractions:["Rohtang Pass","Solang Valley","Hadimba Temple","Beas River Rafting"], avgBudgetPerDay:2000, rating:4.7 },
  { name:"Kerala Backwaters",state:"Kerala",            bestSeason:["Winter"],           category:"Nature",    lat:9.4981,  lng:76.3388, description:"God's own country — serene backwaters, houseboats and lush green landscapes.", topAttractions:["Alleppey Houseboat","Munnar Tea Gardens","Periyar Wildlife","Kovalam Beach"], avgBudgetPerDay:3000, rating:4.8 },
  { name:"Jaipur",          state:"Rajasthan",          bestSeason:["Winter"],           category:"Heritage",  lat:26.9124, lng:75.7873, description:"The Pink City with magnificent forts, palaces and vibrant Rajasthani culture.", topAttractions:["Amer Fort","Hawa Mahal","City Palace","Jantar Mantar"], avgBudgetPerDay:2200, rating:4.7 },
  { name:"Varanasi",        state:"Uttar Pradesh",      bestSeason:["Winter"],           category:"Pilgrimage",lat:25.3176, lng:82.9739, description:"India's oldest living city — the spiritual capital on the sacred Ganges river.", topAttractions:["Ganga Aarti","Dasaswamedh Ghat","Kashi Vishwanath Temple","Sarnath"], avgBudgetPerDay:1500, rating:4.5 },
  { name:"Darjeeling",      state:"West Bengal",        bestSeason:["Summer","Monsoon"], category:"Mountain",  lat:27.0360, lng:88.2627, description:"Queen of the hills with tea gardens, toy train and Himalayan panoramas.", topAttractions:["Tiger Hill","Tea Garden Tours","Darjeeling Himalayan Railway","Batasia Loop"], avgBudgetPerDay:1800, rating:4.5 },
  { name:"Agra",            state:"Uttar Pradesh",      bestSeason:["Winter"],           category:"Heritage",  lat:27.1767, lng:78.0081, description:"Home to the iconic Taj Mahal, one of the Seven Wonders of the World.", topAttractions:["Taj Mahal","Agra Fort","Fatehpur Sikri","Mehtab Bagh"], avgBudgetPerDay:2000, rating:4.8 },
  { name:"Andaman Islands", state:"Andaman & Nicobar",  bestSeason:["Winter","Summer"],  category:"Beach",     lat:11.7401, lng:92.6586, description:"Pristine beaches, coral reefs and turquoise waters — India's tropical island paradise.", topAttractions:["Radhanagar Beach","Havelock Island","Cellular Jail","Scuba Diving"], avgBudgetPerDay:3500, rating:4.8 },
  { name:"Rishikesh",       state:"Uttarakhand",        bestSeason:["Summer","Winter"],  category:"Adventure", lat:30.0869, lng:78.2676, description:"Yoga capital of the world and gateway to Himalayan treks and white water rafting.", topAttractions:["Ganga Aarti","River Rafting","Bungee Jumping","Laxman Jhula"], avgBudgetPerDay:1500, rating:4.6 },
  { name:"Udaipur",         state:"Rajasthan",          bestSeason:["Winter"],           category:"Heritage",  lat:24.5854, lng:73.7125, description:"City of Lakes with breathtaking palaces, serene lakes and Rajput grandeur.", topAttractions:["Lake Pichola","City Palace","Jag Mandir","Sajjangarh Palace"], avgBudgetPerDay:2500, rating:4.8 },
  { name:"Coorg",           state:"Karnataka",          bestSeason:["Summer","Monsoon"], category:"Nature",    lat:12.4244, lng:75.7382, description:"Scotland of India with misty hills, coffee plantations and cool weather.", topAttractions:["Abbey Falls","Raja Seat","Coffee Estates","Dubare Elephant Camp"], avgBudgetPerDay:2000, rating:4.5 },
  { name:"Mangalore",       state:"Karnataka",          bestSeason:["Winter","Summer","Monsoon"], category:"Beach", lat:12.9141, lng:74.8560, description:"Coastal Karnataka city known for beaches, temples, seafood, river views and a relaxed port-city vibe.", aliases:["Manglore"], topAttractions:["Panambur Beach","Tannirbhavi Beach","Kudroli Gokarnath Temple","St. Aloysius Chapel"], avgBudgetPerDay:1800, rating:4.4 },
  { name:"Chikmagalur",     state:"Karnataka",          bestSeason:["Summer","Monsoon","Winter"], category:"Nature", lat:13.3161, lng:75.7720, description:"Coffee country hill escape with misty peaks, waterfalls, estate stays and scenic Western Ghats drives.", aliases:["Chikka Manglore","Chikmagaluru","Chickmagalur"], topAttractions:["Mullayanagiri Peak","Baba Budangiri","Hebbe Falls","Coffee Estates"], avgBudgetPerDay:2200, rating:4.6 },
  { name:"Spiti Valley",    state:"Himachal Pradesh",   bestSeason:["Summer"],           category:"Adventure", lat:32.2461, lng:78.0344, description:"Cold desert mountain valley with ancient monasteries and dramatic landscapes.", topAttractions:["Key Monastery","Chandratal Lake","Kunzum Pass","Pin Valley"], avgBudgetPerDay:1800, rating:4.7 },
  { name:"Mysore",          state:"Karnataka",          bestSeason:["Winter","Summer"],  category:"Heritage",  lat:12.2958, lng:76.6394, description:"City of palaces, sandalwood and the famous Mysore Dasara festival.", topAttractions:["Mysore Palace","Chamundeshwari Temple","Brindavan Gardens","Devaraja Market"], avgBudgetPerDay:1800, rating:4.5 },
  { name:"Leh Ladakh",      state:"Ladakh",             bestSeason:["Summer"],           category:"Adventure", lat:34.1526, lng:77.5770, description:"High altitude desert with Buddhist monasteries, snow peaks and magnetic hills.", topAttractions:["Pangong Lake","Nubra Valley","Hemis Monastery","Magnetic Hill"], avgBudgetPerDay:3000, rating:4.9 },
  { name:"Munnar",          state:"Kerala",             bestSeason:["Winter","Summer"],  category:"Nature",    lat:10.0889, lng:77.0595, description:"Misty hill station with rolling tea estates, waterfalls and exotic wildlife.", topAttractions:["Tea Museum","Eravikulam National Park","Mattupetty Dam","Anamudi Peak"], avgBudgetPerDay:2200, rating:4.6 },
  { name:"Hampi",           state:"Karnataka",          bestSeason:["Winter"],           category:"Heritage",  lat:15.3350, lng:76.4600, description:"UNESCO World Heritage Site — ruins of the Vijayanagara Empire.", topAttractions:["Virupaksha Temple","Vittala Temple","Stone Chariot","Hemakuta Hill"], avgBudgetPerDay:1200, rating:4.6 },
  { name:"Ooty",            state:"Tamil Nadu",         bestSeason:["Summer"],           category:"Nature",    lat:11.4102, lng:76.6950, description:"Queen of Hill Stations with botanical gardens, lakes and toy train rides.", topAttractions:["Ooty Lake","Botanical Gardens","Doddabetta Peak","Nilgiri Mountain Railway"], avgBudgetPerDay:1800, rating:4.4 },
  { name:"Jim Corbett",     state:"Uttarakhand",        bestSeason:["Winter","Summer"],  category:"Wildlife",  lat:29.5300, lng:78.7747, description:"India's oldest national park — famous for Bengal tigers and elephants.", topAttractions:["Tiger Safari","Elephant Ride","Corbett Museum","Dhikala Zone"], avgBudgetPerDay:4000, rating:4.6 },
  { name:"Amritsar",        state:"Punjab",             bestSeason:["Winter","Summer"],  category:"Pilgrimage",lat:31.6340, lng:74.8723, description:"Home of the magnificent Golden Temple and the moving Wagah Border ceremony.", topAttractions:["Golden Temple","Jallianwala Bagh","Wagah Border","Durgiana Temple"], avgBudgetPerDay:1500, rating:4.8 },
  { name:"Kolkata",         state:"West Bengal",        bestSeason:["Winter"],           category:"City",      lat:22.5726, lng:88.3639, description:"Cultural capital of India with colonial architecture, art and the finest street food.", topAttractions:["Victoria Memorial","Howrah Bridge","Dakshineswar Temple","College Street"], avgBudgetPerDay:1800, rating:4.4 },
  { name:"Khajuraho",       state:"Madhya Pradesh",    bestSeason:["Winter"],           category:"Heritage",  lat:24.8318, lng:79.9199, description:"UNESCO World Heritage temples with exquisite medieval sculptures.", topAttractions:["Western Temple Group","Eastern Temples","Sound & Light Show","Panna National Park"], avgBudgetPerDay:1500, rating:4.5 },
  { name:"Rann of Kutch",   state:"Gujarat",           bestSeason:["Winter"],           category:"Nature",    lat:23.7337, lng:69.8597, description:"World's largest salt desert — magical white landscape during Rann Utsav festival.", topAttractions:["White Rann","Kala Dungar","Flamingo Sanctuary","Handicraft Village"], avgBudgetPerDay:2000, rating:4.7 },
  { name:"Shillong",        state:"Meghalaya",         bestSeason:["Summer","Monsoon"], category:"Nature",    lat:25.5788, lng:91.8933, description:"Scotland of the East with living root bridges, waterfalls and misty valleys.", topAttractions:["Living Root Bridge","Elephant Falls","Shillong Peak","Ward Lake"], avgBudgetPerDay:1800, rating:4.5 },
  { name:"Jaisalmer",       state:"Rajasthan",         bestSeason:["Winter"],           category:"Adventure", lat:26.9157, lng:70.9083, description:"The Golden City with magnificent fort, camel safaris and Thar Desert camping.", topAttractions:["Jaisalmer Fort","Sam Sand Dunes","Patwon Ki Haveli","Camel Safari"], avgBudgetPerDay:2200, rating:4.7 },
  { name:"Puri",            state:"Odisha",            bestSeason:["Winter"],           category:"Pilgrimage",lat:19.8134, lng:85.8312, description:"Sacred beach city with the Jagannath Temple and golden Puri beach.", topAttractions:["Jagannath Temple","Puri Beach","Chilika Lake","Konark Sun Temple"], avgBudgetPerDay:1500, rating:4.4 },
];

const PLACE_GUIDES = {
  jaipur: [
    { name:"Amer Fort", area:"Amer", type:"Fort", bestTime:"Morning or late afternoon", description:"Hilltop fort famous for Sheesh Mahal, courtyards, elephant path views and grand Rajput architecture." },
    { name:"Hawa Mahal", area:"Old City", type:"Palace", bestTime:"Early morning", description:"The iconic pink facade with hundreds of small windows, best seen from the street and nearby rooftop cafes." },
    { name:"City Palace", area:"Old City", type:"Palace", bestTime:"Late morning", description:"Royal museum complex with courtyards, gates, textiles, weapons and views into Jaipur's royal history." },
    { name:"Jantar Mantar", area:"Old City", type:"Heritage", bestTime:"Morning", description:"UNESCO-listed astronomical observatory with giant instruments built for measuring time and celestial positions." },
    { name:"Nahargarh Fort", area:"Aravalli Hills", type:"Fort", bestTime:"Sunset", description:"Ridge-top fort with wide Jaipur city views, sunset points and a relaxed evening atmosphere." },
    { name:"Jaigarh Fort", area:"Amer", type:"Fort", bestTime:"Morning", description:"Massive defensive fort known for Jaivana cannon, long walls and sweeping views over Amer." },
    { name:"Albert Hall Museum", area:"Ram Niwas Garden", type:"Museum", bestTime:"Afternoon or evening", description:"Indo-Saracenic museum with art, crafts, armor, carpets and a beautifully lit exterior at night." },
    { name:"Jal Mahal", area:"Man Sagar Lake", type:"Lake Palace", bestTime:"Sunrise or sunset", description:"Water palace viewed from the lakeside promenade, especially pretty during golden light." },
    { name:"Birla Mandir", area:"Tilak Nagar", type:"Temple", bestTime:"Evening", description:"White marble temple dedicated to Lakshmi Narayan, peaceful for evening visits and city views." },
    { name:"Patrika Gate", area:"Jawahar Circle", type:"Photo Spot", bestTime:"Morning", description:"Colorful gateway with painted arches and one of Jaipur's most popular photography spots." },
    { name:"Bapu Bazaar", area:"Old City", type:"Market", bestTime:"Evening", description:"Busy shopping street for juttis, textiles, handicrafts, perfumes and Jaipur souvenirs." },
    { name:"Galta Ji Temple", area:"Khania-Balaji", type:"Temple", bestTime:"Morning", description:"Historic temple complex in the hills with water tanks, painted pavilions and a pilgrimage feel." },
  ],
  "spiti valley": [
    { name:"Key Monastery", area:"Kaza / Key", type:"Monastery", bestTime:"Morning", hotelKeywords:["key","kaza","monastery"], description:"Spiti's most famous hilltop monastery, known for prayer halls, murals, valley views and peaceful Buddhist atmosphere." },
    { name:"Chandratal Lake", area:"Chandratal", type:"Lake", bestTime:"June to September", hotelKeywords:["chandratal","camp"], description:"High-altitude crescent lake with camping routes, dramatic mountains and one of Spiti's best overnight experiences." },
    { name:"Kunzum Pass", area:"Kunzum / Losar", type:"Mountain Pass", bestTime:"Daytime in summer", hotelKeywords:["kunzum","losar"], description:"Scenic pass connecting Lahaul and Spiti, with prayer flags, mountain views and road-trip stops." },
    { name:"Pin Valley", area:"Pin Valley", type:"Nature", bestTime:"Morning to afternoon", hotelKeywords:["pin","mud village"], description:"Cold desert valley known for villages, wildlife landscapes, trekking routes and Pin Valley National Park." },
    { name:"Kibber Village", area:"Kibber / Kaza", type:"Village", bestTime:"Morning", hotelKeywords:["kaza","key","spiti"], description:"High-altitude village near Key Monastery, useful for short hikes, wildlife routes and traditional homes." },
    { name:"Dhankar Monastery", area:"Dhankar", type:"Monastery", bestTime:"Morning", hotelKeywords:["kaza","spiti","monastery"], description:"Clifftop monastery above the Spiti and Pin river confluence, with old-world architecture and wide valley views." },
  ],
  mangalore: [
    { name:"Panambur Beach", area:"Panambur", type:"Beach", bestTime:"Evening", hotelKeywords:["panambur","beachfront"], description:"Popular clean beach for sunset walks, water activities and relaxed coastal evenings." },
    { name:"Tannirbhavi Beach", area:"Tannirbhavi", type:"Beach", bestTime:"Sunset", hotelKeywords:["tannirbhavi","river view"], description:"Calmer beach across the river, good for long walks, sunset views and quieter seaside time." },
    { name:"Kudroli Gokarnath Temple", area:"Kudroli", type:"Temple", bestTime:"Morning or evening", hotelKeywords:["kudroli","temple residency"], description:"Colorful temple complex and one of Mangalore's most visited spiritual landmarks." },
    { name:"St. Aloysius Chapel", area:"Hampankatta", type:"Heritage", bestTime:"Late morning", hotelKeywords:["hampankatta","heritage hotel"], description:"Historic chapel famous for detailed interior paintings and old Mangalore heritage." },
    { name:"Sultan Battery", area:"Boloor", type:"Heritage", bestTime:"Evening", hotelKeywords:["boloor","riverside"], description:"Riverside watchtower built by Tipu Sultan, useful for short visits and boat routes." },
  ],
  chikmagalur: [
    { name:"Mullayanagiri Peak", area:"Mullayanagiri", type:"Mountain", bestTime:"Morning", hotelKeywords:["mullayanagiri","hill view"], description:"Karnataka's highest peak with breezy viewpoints, short climbs and sweeping Western Ghats scenery." },
    { name:"Baba Budangiri", area:"Baba Budangiri", type:"Mountain", bestTime:"Morning to afternoon", hotelKeywords:["baba budangiri","mountain camp"], description:"Scenic hill range known for caves, viewpoints, coffee history and winding mountain roads." },
    { name:"Hebbe Falls", area:"Kemmanagundi", type:"Waterfall", bestTime:"Post-monsoon or morning", hotelKeywords:["kemmanagundi","falls"], description:"Forest waterfall route often paired with Kemmanagundi and full-day nature plans." },
    { name:"Coffee Estates", area:"Chikmagalur", type:"Nature", bestTime:"Morning", hotelKeywords:["chikmagalur","coffee","estate","homestay"], description:"Plantation walks and estate stays that make Chikmagalur one of Karnataka's favorite hill getaways." },
    { name:"Hirekolale Lake", area:"Hirekolale", type:"Lake", bestTime:"Sunset", hotelKeywords:["hirekolale","lake view"], description:"Peaceful lake with hill views, especially pretty around sunset and quick evening drives." },
  ],
};

function hotelNoteForPlace(place, hotel) {
  const area = String(place.area || "").toLowerCase();
  const name = String(hotel.name || "").toLowerCase();

  if (area.includes("kaza") || area.includes("key")) return "Best for Key Monastery and Kaza-based Spiti sightseeing.";
  if (area.includes("chandratal")) return "Good for Chandratal Lake plans and overnight camping routes.";
  if (area.includes("kunzum") || area.includes("losar")) return "Useful for Kunzum Pass and Losar road-trip stopovers.";
  if (area.includes("pin")) return "Best for Pin Valley, Mud Village and nature routes.";
  if (area.includes("dhankar")) return "Works for Dhankar Monastery day trips from the Kaza side.";
  if (area.includes("panambur") || area.includes("tannirbhavi")) return "Good for Mangalore beach plans and coastal sightseeing.";
  if (area.includes("kudroli") || area.includes("hampankatta") || area.includes("boloor")) return "Convenient for Mangalore city temples, heritage stops and short transfers.";
  if (area.includes("mullayanagiri") || area.includes("baba budangiri")) return "Best for Chikmagalur hill drives, viewpoints and coffee country routes.";
  if (area.includes("kemmanagundi")) return "Useful for Hebbe Falls, Kemmanagundi and full-day nature plans.";
  if (area.includes("chikmagalur")) return "Good for coffee estates, lake visits and local Chikmagalur sightseeing.";
  if (area.includes("old city")) return "Good choice for Old City places like Hawa Mahal, City Palace, Jantar Mantar and Bapu Bazaar.";
  if (area.includes("amer")) return "Useful for Amer side sightseeing, including Amer Fort and Jaigarh Fort.";
  if (area.includes("aravalli")) return "Works well for hill-view plans around Nahargarh Fort and evening viewpoints.";
  if (area.includes("man sagar")) return "Convenient for Jal Mahal, Amer Road and north Jaipur sightseeing.";
  if (area.includes("jawahar") || area.includes("tilak")) return "Good for south/central Jaipur routes and quick city transfers.";
  if (name.includes("rambagh")) return "Luxury Jaipur stay with easy car access to major sights.";
  if (name.includes("arya")) return "Budget-friendly Jaipur stay for sightseeing days.";
  return "Available for this sightseeing plan.";
}

function rotatedHotels(hotels, offset = 0) {
  if (!hotels.length) return hotels;
  const start = Math.abs(offset) % hotels.length;
  return [...hotels.slice(start), ...hotels.slice(0, start)];
}

function hotelId(hotel) {
  return String(hotel._id || hotel.name);
}

function hotelsForPlace(place, hotels, fallbackOffset = 0, limit = 4) {
  const autoKeywords = String(place.name || "")
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(word => word.length >= 4);
  const keywords = [...(place.hotelKeywords || []), ...autoKeywords].map(k => String(k).toLowerCase());
  const fallbackHotels = rotatedHotels(hotels, fallbackOffset);
  if (keywords.length === 0) return fallbackHotels.slice(0, limit);

  const matched = hotels.filter(hotel => {
    const text = [
      hotel.name,
      hotel.location,
      hotel.city,
      hotel.description,
    ].join(" ").toLowerCase();
    return keywords.some(keyword => text.includes(keyword));
  });

  const selected = matched.slice(0, limit);
  if (selected.length >= limit) return selected;

  const selectedIds = new Set(selected.map(hotelId));
  const fallback = fallbackHotels.filter(hotel => !selectedIds.has(hotelId(hotel)));
  return [...selected, ...fallback].slice(0, limit);
}

function hotelMatchesPlace(place, hotel) {
  const autoKeywords = String(place.name || "")
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(word => word.length >= 4);
  const keywords = [...(place.hotelKeywords || []), ...autoKeywords].map(k => String(k).toLowerCase());
  const text = [hotel.name, hotel.location, hotel.city, hotel.description].join(" ").toLowerCase();
  return keywords.some(keyword => text.includes(keyword));
}

function uniqueHotels(hotels) {
  const seen = new Set();
  return hotels.filter(hotel => {
    const id = String(hotel._id || hotel.name);
    if (seen.has(id)) return false;
    seen.add(id);
    return true;
  });
}

async function buildDestinationPlaceGuide(dest, placeHotelLimit = 4) {
  const destinationHotels = await Hotel.find({
    $or: [
      { city: { $regex: dest.name, $options:"i" } },
      { location: { $regex: dest.name, $options:"i" } },
      { name: { $regex: dest.name, $options:"i" } },
    ],
  }).sort({ rating:-1 }).limit(8);
  const stateHotels = await Hotel.find({ state: { $regex: dest.state, $options:"i" } }).sort({ rating:-1 }).limit(12);
  const hotels = uniqueHotels([...destinationHotels, ...stateHotels]);
  const guide = PLACE_GUIDES[dest.name.toLowerCase()] || dest.topAttractions.map(name => ({
    name,
    area: dest.name,
    type: dest.category,
    bestTime: "Plan around your day route",
    hotelKeywords: [name],
    description: `A recommended place to visit in ${dest.name}.`,
  }));
  const hotelsForPlaces = hotels.length ? hotels : stateHotels;
  const placesToVisit = guide.map((place, index) => ({
    ...place,
    hotels: hotelsForPlace(place, hotelsForPlaces, index * placeHotelLimit, placeHotelLimit).map(hotel => ({
      ...(hotel.toObject ? hotel.toObject() : hotel),
      nearbyNote: hotelMatchesPlace(place, hotel)
        ? hotelNoteForPlace(place, hotel)
        : `Available in ${dest.name} / ${dest.state} for this trip plan.`,
    })),
  }));

  return { hotels: hotels.slice(0, 6), placesToVisit };
}

app.get("/api/india-destinations", async (req, res) => {
  try {
    const { season, category, state, search } = req.query;
    await ensureIndiaDestinations();
    let query = {};
    if (season && season !== "All")   query.bestSeason = { $in: [season] };
    if (category && category !== "All") query.category = category;
    if (state)  query.state = { $regex: state,  $options:"i" };
    if (search) {
      const searchTerms = searchTermsForPlace(search);
      query.$or = searchTerms.flatMap(term => [
        { name:{ $regex:term,$options:"i" }},
        { state:{ $regex:term,$options:"i" }},
        { description:{ $regex:term,$options:"i" }},
        { aliases:{ $regex:term,$options:"i" }},
      ]);
    }

    let dests = await IndiaDest.find(query).sort({ rating: -1 });
    res.json({ destinations: dests });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

app.get("/api/india-destinations/:id", async (req, res) => {
  try {
    await ensureIndiaHotels();
    const dest = await IndiaDest.findById(req.params.id);
    if (!dest) return res.status(404).json({ message: "Destination not found" });
    const { hotels, placesToVisit } = await buildDestinationPlaceGuide(dest);
    res.json({ destination: dest, hotels, placesToVisit });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ================================================================
//  CHATBOT — Smart Travel Assistant
// ================================================================
app.post("/api/chatbot", async (req, res) => {
  try {
    const { message } = req.body;
    const msg = message.toLowerCase().trim();

    await ensureIndiaHotels();
    await ensureIndiaDestinations();

    // Get all destinations and India hotels from DB
    let dests  = await IndiaDest.find().sort({ rating:-1 });
    let hotels = await Hotel.find({ state: { $in: INDIA_HOTEL_STATES } }).sort({ rating:-1 });

    // Seed if empty
    if (dests.length === 0) { await ensureIndiaDestinations(); dests = await IndiaDest.find().sort({ rating:-1 }); }
    if (hotels.length === 0) { await ensureIndiaHotels(); hotels = await Hotel.find({ state: { $in: INDIA_HOTEL_STATES } }).sort({ rating:-1 }); }

    let reply   = "";
    let results = { destinations:[], hotels:[], placesToVisit:[] };

    // ── Season detection ─────────────────────────────────────────
    const isSummer  = msg.includes("summer")  || msg.includes("hot")    || msg.includes("april") || msg.includes("may") || msg.includes("june");
    const isWinter  = msg.includes("winter")  || msg.includes("cold")   || msg.includes("december") || msg.includes("january") || msg.includes("november");
    const isMonsoon = msg.includes("monsoon") || msg.includes("rain")   || msg.includes("rainy") || msg.includes("july") || msg.includes("august");

    // ── Category detection ────────────────────────────────────────
    const isBeach     = msg.includes("beach")    || msg.includes("sea")    || msg.includes("coastal") || msg.includes("sand");
    const isMountain  = msg.includes("mountain") || msg.includes("hills")  || msg.includes("trekking") || msg.includes("snow") || msg.includes("hill station");
    const isHeritage  = msg.includes("heritage") || msg.includes("fort")   || msg.includes("palace") || msg.includes("history") || msg.includes("historical");
    const isWildlife  = msg.includes("wildlife") || msg.includes("safari") || msg.includes("tiger")  || msg.includes("jungle");
    const isAdventure = msg.includes("adventure")|| msg.includes("raft")   || msg.includes("bungee") || msg.includes("camping");
    const isPilgrimage= msg.includes("temple")   || msg.includes("pilgrimage")||msg.includes("religious")||msg.includes("spiritual");
    const isNature    = msg.includes("nature")   || msg.includes("waterfall")||msg.includes("forest")||msg.includes("lake");

    // ── Budget detection ──────────────────────────────────────────
    const isBudget  = msg.includes("cheap")  || msg.includes("budget") || msg.includes("affordable") || msg.includes("low cost");
    const isLuxury  = msg.includes("luxury") || msg.includes("5 star") || msg.includes("premium")   || msg.includes("best hotel");

    // ── State/City detection ──────────────────────────────────────
    const STATES = ["goa","rajasthan","kerala","himachal","uttarakhand","karnataka","tamil nadu","maharashtra","gujarat","punjab","west bengal","ladakh","meghalaya","odisha","uttar pradesh","madhya pradesh","andaman"];
    const detectedState = STATES.find(s => msg.includes(s));
    const detectedDestination = dests.find(d => (
      includesPlace(msg, d.name) ||
      d.aliases?.some(alias => includesPlace(msg, alias)) ||
      (d.name === "Mangalore" && msg.includes("manglore")) ||
      (d.name === "Chikmagalur" && (
        msg.includes("chikka manglore") ||
        msg.includes("chikmagaluru") ||
        msg.includes("chickmagalur")
      ))
    ));

    // ── Build filters ─────────────────────────────────────────────
    let seasonFilter   = isSummer ? "Summer" : isWinter ? "Winter" : isMonsoon ? "Monsoon" : null;
    let categoryFilter = isBeach ? "Beach" : isMountain ? "Mountain" : isHeritage ? "Heritage" : isWildlife ? "Wildlife" : isAdventure ? "Adventure" : isPilgrimage ? "Pilgrimage" : isNature ? "Nature" : null;

    // Filter destinations
    results.destinations = dests.filter(d => {
      let match = true;
      if (detectedDestination) match = match && d.name.toLowerCase() === detectedDestination.name.toLowerCase();
      if (seasonFilter)   match = match && d.bestSeason.includes(seasonFilter);
      if (categoryFilter) match = match && d.category === categoryFilter;
      if (detectedState)  match = match && d.state.toLowerCase().includes(detectedState);
      return match;
    }).slice(0, 5);

    const matchedStates = results.destinations.map(d => d.state.toLowerCase());

    // Filter hotels
    results.hotels = hotels.filter(h => {
      let match = true;
      if (isBudget)  match = match && h.category === "Budget";
      if (isLuxury)  match = match && h.category === "Luxury";
      if (detectedDestination) {
        const place = detectedDestination.name.toLowerCase();
        match = match && (
          h.city?.toLowerCase().includes(place) ||
          h.location?.toLowerCase().includes(place) ||
          h.name?.toLowerCase().includes(place)
        );
      }
      if (detectedState) match = match && h.state?.toLowerCase().includes(detectedState);
      if (!detectedDestination && !detectedState && matchedStates.length > 0) {
        match = match && matchedStates.some(s => h.state?.toLowerCase().includes(s));
      }
      if (seasonFilter) match = match && (h.season?.includes(seasonFilter) || h.season?.includes("All Year"));
      return match;
    }).slice(0, 4);

    if (detectedDestination && results.hotels.length === 0) {
      results.hotels = hotels.filter(h => h.state?.toLowerCase().includes(detectedDestination.state.toLowerCase())).slice(0, 4);
    }

    if (detectedDestination) {
      const placeGuide = await buildDestinationPlaceGuide(detectedDestination, 3);
      results.placesToVisit = placeGuide.placesToVisit;
      let destinationHotels = placeGuide.hotels;
      if (isBudget) destinationHotels = destinationHotels.filter(h => h.category === "Budget");
      if (isLuxury) destinationHotels = destinationHotels.filter(h => h.category === "Luxury");
      results.hotels = destinationHotels.length ? destinationHotels : placeGuide.hotels;
    }

    // ── If nothing matched, return top rated ──────────────────────
    if (results.destinations.length === 0) results.destinations = dests.slice(0, 5);

    // ── Build smart reply ─────────────────────────────────────────
    if (msg.includes("hello") || msg.includes("hi") || msg.includes("hey")) {
      reply = "👋 Hey there! I'm your Travel Assistant! I can help you find the best destinations, hotels, and travel tips for any season. Try asking:\n\n• 'Best places to visit in winter'\n• 'Beach destinations in Goa'\n• 'Budget hotels in Rajasthan'\n• 'Adventure trips in summer'\n• 'Wildlife safari destinations'";
    } else if (msg.includes("cancel") || msg.includes("refund")) {
      reply = "💡 To cancel a booking, go to **My Bookings** page → click **Cancel Booking**. Refund of the full amount will be processed in 5-7 business days. You'll get a notification once cancelled.";
      results = { destinations:[], hotels:[], placesToVisit:[] };
    } else if (msg.includes("payment") || msg.includes("pay")) {
      reply = "💳 Payments are simulated for testing. Once you book a hotel, go to **Bookings** → click **Pay Now**. You can use any card details in test mode.";
      results = { destinations:[], hotels:[], placesToVisit:[] };
    } else {
      // Build context-aware reply
      const seasonText   = seasonFilter   ? `perfect for **${seasonFilter}**` : "great to visit";
      const categoryText = categoryFilter ? `**${categoryFilter}** destinations` : "destinations";

      if (results.destinations.length > 0) {
        reply = `🌍 Here are ${results.destinations.length} ${categoryText} ${seasonText}`;
        if (detectedDestination) reply += ` for **${detectedDestination.name}**`;
        else if (detectedState) reply += ` in **${detectedState}**`;
        reply += `:\n\n`;
        results.destinations.forEach((d, i) => {
          reply += `${i+1}. **${d.name}**, ${d.state} ⭐${d.rating}\n`;
          reply += `   📅 Best in: ${d.bestSeason.join(", ")} | 💰 ~₹${d.avgBudgetPerDay}/day\n`;
          if (d.topAttractions?.length) reply += `   Places to visit: ${d.topAttractions.join(", ")}\n`;
          reply += `   ${d.description.slice(0, 80)}...\n\n`;
        });
        if (results.hotels.length > 0) {
          reply += `🏨 **Available Hotels:**\n`;
          results.hotels.forEach(h => {
            reply += `• ${h.name} (${h.location}) — ₹${h.price?.toLocaleString()}/night [${h.category}] ⭐${h.rating}\n`;
          });
        }
      } else {
        reply = "🤔 I couldn't find exact matches. Try asking about a specific season (summer/winter/monsoon), place type (beach/mountain/heritage), or state like 'Goa' or 'Rajasthan'. I'll find the best options!";
      }
    }

    res.json({ reply, results });
  } catch (err) {
    res.status(500).json({ reply: "Sorry, something went wrong. Please try again!", results:{ destinations:[], hotels:[], placesToVisit:[] } });
  }
});

// ================================================================
//  ADMIN ROUTES
// ================================================================
app.get("/api/admin/stats", checkLogin, checkAdmin, async (req, res) => {
  const [totalUsers, totalTrips, totalHotels, totalBookings, totalDests] = await Promise.all([
    User.countDocuments(), Trip.countDocuments(), Hotel.countDocuments(),
    Booking.countDocuments(), IndiaDest.countDocuments(),
  ]);
  const revenueData = await Booking.aggregate([{ $match:{ paymentStatus:"paid" }},{ $group:{ _id:null, total:{ $sum:"$totalPrice" }}}]);
  const cancelledCount = await Booking.countDocuments({ status:"cancelled" });
  res.json({ totalUsers, totalTrips, totalHotels, totalBookings, totalDests, totalRevenue:revenueData[0]?.total||0, cancelledCount });
});
app.get("/api/admin/users",    checkLogin, checkAdmin, async (req, res) => { res.json({ users:    await User.find().select("-password").sort({ createdAt:-1 }) }); });
app.get("/api/admin/bookings", checkLogin, checkAdmin, async (req, res) => { res.json({ bookings: await Booking.find().sort({ createdAt:-1 }) }); });
app.get("/api/admin/trips",    checkLogin, checkAdmin, async (req, res) => { res.json({ trips:    await Trip.find().sort({ createdAt:-1 }) }); });
app.put("/api/admin/users/:id/role", checkLogin, checkAdmin, async (req, res) => {
  const user = await User.findByIdAndUpdate(req.params.id, { role:req.body.role }, { new:true }).select("-password");
  res.json({ user });
});
app.delete("/api/admin/users/:id", checkLogin, checkAdmin, async (req, res) => {
  await User.findByIdAndDelete(req.params.id); res.json({ message:"User deleted" });
});

// ================================================================
//  DESTINATIONS (for Map)
// ================================================================
app.get("/api/destinations", async (req, res) => {
  await ensureIndiaDestinations();
  const dests = await IndiaDest.find().sort({ rating:-1 });
  res.json({ destinations: dests.map(d => ({ ...d.toObject(), lat:d.lat, lng:d.lng, country:"India", info:d.description })) });
});


// Health check route
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "Server is running!", port: process.env.PORT || 5000 });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server at http://localhost:${PORT}`));
