import React from "react";
import "./css/ProductsAndServices.css";
import Header from "./Header";
import Footer from "./Footer";

// Import icons with only available FontAwesome icons
import { 
  FaRobot, 
  FaGraduationCap, 
  FaSchool, 
  FaLaptop, 
  FaKeyboard, 
  FaMouse, 
  FaMobile,
  FaNetworkWired, 
  FaBatteryFull, 
  FaCarBattery, 
  FaPrint, 
  FaSearch, 
  FaFileInvoice, 
  FaDollarSign, 
  FaUserShield, 
  FaIdCard, 
  FaDesktop, 
  FaTools, 
  FaPaperclip 
} from "react-icons/fa";

const productsAndServicesData = [
  {
    category: "STEM & Education",
    tagline: "Empowering Generations, Transforming the world",
    items: [
      {
        name: "STEM Equipment & Robotics Kits",
        icon: <FaRobot />,
        details: [
          "Educational Kits (ACEBOTT, RobotLinking, Makeblock mBot Mega Kit)",
          "Development Boards (Arduino, Raspberry Pi, Micro:bit, STM32, Pic Boards, MYIR Industrial Boards)",
          "Sensors (IoT, Wireless, Load, Pressure, Flow, Vibration, Temperature, Humidity, Gas, Light, Sound, Distance, Biometric, Rotation & Current)",
          "3D Printers/CNC Parts",
          "Drone Parts",
          "Instruments & Tools",
          "Electronic Modules",
        ],
        badge: "Countrywide Delivery",
      },
      {
        name: "NexDawn Skills Academy",
        icon: <FaGraduationCap />,
        details: ["Coding", "AI", "Robotics", "Design", "Virtual Assistant"],
      },
      {
        name: "Tech-Ed Content & School Partnerships",
        icon: <FaSchool />,
        details: [],
      },
    ],
  },
  {
    category: "TECH SHOP",
    tagline: "Sales of new and refurbished computers and all essential IT peripherals",
    items: [
      { name: "Desktop Computers", icon: <FaDesktop />, details: [] },
      { name: "Laptops", icon: <FaLaptop />, details: [] },
      { name: "Gaming Keyboards", icon: <FaKeyboard />, details: [] },
      { name: "Gaming Mouse", icon: <FaMouse />, details: [] },
      { name: "Smart Watches (Oraimo)", icon: <FaMobile />, details: [] },
      { name: "Networking Accessories", icon: <FaNetworkWired />, details: [] },
      { name: "Rechargeable Mouse", icon: <FaMouse />, details: [] },
      { name: "Handboss Universal Cleaning Agent", icon: <FaTools />, details: [] },
    ],
    badge: "Countrywide Delivery",
  },
  {
    category: "DIGITAL & BUSINESS SERVICES",
    tagline: "Professional branding and printing solutions for your business",
    items: [
      {
        name: "Branding & Printing",
        icon: <FaPrint />,
        details: [
          "Professional design and printing for banners, Caps, T-shirts, 3D/2D signage, and other merchandise.",
        ],
      },
    ],
  },
  {
    category: "POWER SOLUTIONS",
    tagline: "Reliable power solutions for home, office, and outdoor use",
    items: [
      { name: "Hithium 200W Portable Power Station", icon: <FaBatteryFull />, details: [] },
      { name: "Car Battery Jump Starter Kits", icon: <FaCarBattery />, details: [] },
    ],
    badge: "Countrywide Delivery",
  },
  {
    category: "ONLINE SERVICES",
    tagline: "Comprehensive online government and business services",
    items: [
      { name: "Business Name search & registration", icon: <FaSearch />, details: [] },
      { name: "TSC/PSC Payslips", icon: <FaFileInvoice />, details: [] },
      { name: "KRA Services", icon: <FaDollarSign />, details: [] },
      { name: "HELB Services", icon: <FaGraduationCap />, details: [] },
      { name: "Good Conduct", icon: <FaUserShield />, details: [] },
      { name: "NTSA Services", icon: <FaIdCard />, details: [] },
      { name: "eCitizen", icon: <FaDesktop />, details: [] },
    ],
  },
  {
    category: "REPAIR & MAINTENANCE",
    tagline: "Expert repair services for all your electronic devices",
    items: [
      { name: "Laptops", icon: <FaLaptop />, details: [] },
      { name: "Desktop Computers", icon: <FaDesktop />, details: [] },
      { name: "Phones etc.", icon: <FaTools />, details: [] },
    ],
  },
  {
    category: "STATIONARIES",
    tagline: "High-quality stationery supplies for office and personal use",
    items: [
      { name: "A4 Printing Papers", icon: <FaPaperclip />, details: [] },
      { name: "A3 Printing Papers", icon: <FaPaperclip />, details: [] },
      { name: "Glossy Photo Paper", icon: <FaPaperclip />, details: [] },
      { name: "A4 Envelopes", icon: <FaPaperclip />, details: [] },
      { name: "A5 Envelopes", icon: <FaPaperclip />, details: [] },
      { name: "A3 Envelopes", icon: <FaPaperclip />, details: [] },
      { name: "B5 Envelopes", icon: <FaPaperclip />, details: [] },
    ],
  },
];

const ProductsAndServices = () => {
  return (
    <div>
    <Header />    
    <div className="homepage">
      {/* Main title for the entire section */}
      <h1 className="home-main-section-title">✨ Our Products & Services</h1>
      <p className="home-main-section-subtitle">
        A comprehensive range of tech, education, and business solutions designed to meet all your needs
      </p>

      {productsAndServicesData.map((section, index) => (
        <section
          key={index}
          id={`service-${section.category
            .toLowerCase()
            .replace(/[^a-z0-9]/g, "-")}`}
          className="service-section home-product-section"
        >
          <div className="service-header">
            <h2>{section.category}</h2>
            {section.tagline && (
              <p className="service-tagline">{section.tagline}</p>
            )}
            {section.badge && (
              <div className="service-delivery-badge">{section.badge}</div>
            )}
          </div>

          <div className="service-grid">
            {section.items.map((item, itemIndex) => (
              <div key={itemIndex} className="service-card">
                <div className="service-card-header">
                  <div className="service-icon">
                    {item.icon}
                  </div>
                  <h3>{item.name}</h3>
                </div>
                {item.details.length > 0 && (
                  <ul className="service-details-list">
                    {item.details.map((detail, detailIndex) => (
                      <li key={detailIndex}>{detail}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </section>
      ))}
      
      {/* Single Enquire Now button at the bottom */}
      <div className="service-main-enquire-btn-container">
        <button className="home-add-to-cart-btn service-main-enquire-btn">
          Enquire Now
        </button>
      </div>
    </div>
    <Footer />
    </div>
  );
};

export default ProductsAndServices;