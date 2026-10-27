import React from "react";
import { Link } from "react-router-dom";
import "../styles/LandingPage.css";

const LandingPage = () => {
  return (
    <div className="klib-landing-root">
      {/* 1. Hero Section with Government Heritage Atmosphere */}
      <section className="klib-hero-section">
        <div className="klib-hero-content">
          <div className="klib-hero-badge">
            <span className="klib-badge-flag">🇳🇵</span>
            <span>नेपाल सरकार · शिक्षा, विज्ञान तथा प्रविधि मन्त्रालय</span>
          </div>

          <h1 className="klib-hero-headline">
            केसर पुस्तकालय <span className="klib-hero-headline-en">(Kaiser Library)</span>
            <span className="klib-hero-headline-sub">
              ऐतिहासिक राष्ट्रिय धरोहर तथा आधुनिक ई-पुस्तकालय प्रणाली
            </span>
          </h1>

          <p className="klib-hero-description">
            फिल्डमार्शल केशर शमशेर जङ्गबहादुर राणाद्वारा स्थापित ऐतिहासिक ग्रन्थ, पाण्डुलिपि, दुर्लभ चित्रकला तथा आधुनिक प्राज्ञिक पुस्तकहरूको राष्ट्रिय डिजिटल व्यवस्थापन तथा अनलाइन सर्कुलेसन पोर्टल ।
          </p>

          <div className="klib-hero-actions">
            <Link to="/login" className="klib-cta-primary">
              🔑 पुस्तकालय प्रवेश (Sign In Portal) &rarr;
            </Link>
            <Link to="/student-dashboard/browse" className="klib-cta-secondary">
              🔍 अनलाइन क्याटलग खोज्नुहोस् (OPAC Catalog)
            </Link>
            <Link to="/student-dashboard/digital-library" className="klib-cta-outline">
              💻 ई-पुस्तकालय (E-Library)
            </Link>
          </div>

          {/* Quick Institutional Stats */}
          <div className="klib-stats-ribbon">
            <div className="klib-stat-tile">
              <span className="klib-stat-num">६०,०००+</span>
              <span className="klib-stat-label">ऐतिहासिक तथा प्राज्ञिक ग्रन्थ</span>
            </div>
            <div className="klib-stat-tile">
              <span className="klib-stat-num">वि.सं. १९६४</span>
              <span className="klib-stat-label">केशर महल, कान्तिपथ (Est. 1907)</span>
            </div>
            <div className="klib-stat-tile">
              <span className="klib-stat-num">१००% डिजिटल</span>
              <span className="klib-stat-label">RFID सर्कुलेसन तथा स्वचालन</span>
            </div>
            <div className="klib-stat-tile">
              <span className="klib-stat-num">२ भूमिकाहरू</span>
              <span className="klib-stat-label">विद्यार्थी र पुस्तकालय अधिकृत</span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Core Library Services (सेवाहरू - klib.gov.np Framework) */}
      <section className="klib-services-section">
        <div className="klib-section-header">
          <span className="klib-section-tag">SERVICES & DIGITAL ACCESS</span>
          <h2 className="klib-section-title">प्रमुख पुस्तकालय सेवाहरू (Key Library Services)</h2>
          <p className="klib-section-desc">
            केशर पुस्तकालयद्वारा पाठक, अनुसन्धानकर्ता, विद्यार्थी तथा अधिकृतहरूका लागि उपलब्ध सेवाहरू:
          </p>
        </div>

        <div className="klib-services-grid">
          {/* Service 1: OPAC */}
          <div className="klib-service-card">
            <div className="klib-card-icon navy">📖</div>
            <h3 className="klib-card-title">पुस्तकालय सूचीपत्र (OPAC)</h3>
            <p className="klib-card-text">
              शीर्षक, लेखक, विधा, विभाग, तथा ISBN नम्बर अनुसार भौतिक पुस्तकहरूको सूची, र्याक तथा दराज (Shelf Map) को प्रत्यक्ष खोजी गर्नुहोस् ।
            </p>
            <Link to="/student-dashboard/browse" className="klib-card-link">
              क्याटलग हेर्नुहोस् &rarr;
            </Link>
          </div>

          {/* Service 2: Digital Library */}
          <div className="klib-service-card">
            <div className="klib-card-icon crimson">💻</div>
            <h3 className="klib-card-title">ई-पुस्तकालय (E-Library)</h3>
            <p className="klib-card-text">
              डिजिटाइज गरिएका दुर्लभ पाण्डुलिपि, राष्ट्रिय अनुसन्धान पत्र, पत्रपत्रिका तथा प्राज्ञिक ई-पुस्तकहरू अनलाइन अध्ययन गर्नुहोस् ।
            </p>
            <Link to="/student-dashboard/digital-library" className="klib-card-link crimson">
              डिजिटल स्रोतहरू &rarr;
            </Link>
          </div>

          {/* Service 3: Circulation & RFID */}
          <div className="klib-service-card">
            <div className="klib-card-icon gold">🏷️</div>
            <h3 className="klib-card-title">RFID तथा सर्कुलेसन डेस्क</h3>
            <p className="klib-card-text">
              पुस्तक जारी (Issue), फिर्ता (Return), नविकरण (Renew), तथा स्वचालित जरिवाना (Fines) व्यवस्थापन आरएफआईडी डेस्कबाट सहजरूपमा सञ्चालन ।
            </p>
            <Link to="/login" className="klib-card-link gold">
              अधिकृत डेस्क &rarr;
            </Link>
          </div>

          {/* Service 4: Citizen Charter */}
          <div className="klib-service-card">
            <div className="klib-card-icon green">📜</div>
            <h3 className="klib-card-title">नागरिक बडापत्र (Citizen Charter)</h3>
            <p className="klib-card-text">
              पुस्तकालय खुल्ने समय (आइतबार-बिहीबार १०:००-५:००, शुक्रबार १०:००-३:००), सदस्यता शुल्क, अध्ययन कक्ष नियम तथा सेवा प्रक्रियाको विवरण ।
            </p>
            <Link to="/student-dashboard/alerts" className="klib-card-link green">
              नियम तथा समय &rarr;
            </Link>
          </div>
        </div>
      </section>

      {/* 3. Role Access Portals (Librarian vs Student) */}
      <section className="klib-roles-section">
        <div className="klib-section-header">
          <span className="klib-section-tag">ROLE BASED PORTALS</span>
          <h2 className="klib-section-title">पुस्तकालय पोर्टल प्रवेश (System Access)</h2>
          <p className="klib-section-desc">
            आफ्नो आधिकारिक परिचयका आधारमा सम्बन्धित पोर्टलमा लगइन वा नयाँ दर्ता गर्नुहोस्:
          </p>
        </div>

        <div className="klib-roles-grid">
          {/* Student Portal Card */}
          <div className="klib-role-card student">
            <div className="klib-role-header">
              <span className="role-icon">🎓</span>
              <div>
                <h3 className="role-title">विद्यार्थी तथा पाठक पोर्टल (Reader Portal)</h3>
                <span className="role-badge">Student / General Member</span>
              </div>
            </div>
            <p className="role-text">
              पुस्तक आरक्षण, व्यक्तिगत ऋण इतिहास (Borrow History), जरिवाना भुक्तानी, सिफारिस प्रणाली, तथा ई-पुस्तकालय अध्ययनका लागि ।
            </p>
            <div className="role-credentials-hint">
              <strong>डेमो ईमेल:</strong> <code>student@example.com</code> · <strong>पासवर्ड:</strong> <code>Password123!</code>
            </div>
            <div className="role-buttons">
              <Link to="/login" className="role-login-btn">
                विद्यार्थी लगइन (Sign In) &rarr;
              </Link>
              <Link to="/register" className="role-register-btn">
                नयाँ सदस्यता दर्ता
              </Link>
            </div>
          </div>

          {/* Librarian Portal Card */}
          <div className="klib-role-card librarian">
            <div className="klib-role-header">
              <span className="role-icon">🧑‍💼</span>
              <div>
                <h3 className="role-title">पुस्तकालय अधिकृत पोर्टल (Librarian Portal)</h3>
                <span className="role-badge librarian">Staff / Admin Management</span>
              </div>
            </div>
            <p className="role-text">
              सर्कुलेसन डेस्क, पुस्तक क्याटलगिङ, दराज नक्सा (Shelf Map), बारकोड/RFID स्क्यानिङ, खरिद बजेट, तथा अडिट लग्स व्यवस्थापन ।
            </p>
            <div className="role-credentials-hint librarian">
              <strong>डेमो ईमेल:</strong> <code>librarian@example.com</code> · <strong>पासवर्ड:</strong> <code>Password123!</code>
            </div>
            <div className="role-buttons">
              <Link to="/login" className="role-login-btn librarian">
                व्यवस्थापक लगइन (Librarian Desk) &rarr;
              </Link>
              <Link to="/login" className="role-register-btn librarian">
                १-क्लिक डेमो प्रवेश
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Contact & Historic Location Strip */}
      <section className="klib-location-strip">
        <div className="klib-location-container">
          <div className="klib-location-info">
            <span className="klib-loc-tag">🏛️ ऐतिहासिक स्थान (HERITAGE LOCATION)</span>
            <h3 className="klib-loc-title">केशर पुस्तकालय, केशर महल, कान्तिपथ, काठमाडौं</h3>
            <p className="klib-loc-details">
              फोन: <strong>+९७७-१-४४१११३१</strong> | ईमेल: <strong>info@klib.gov.np</strong> | फ्याक्स: +९७७-१-४४१११३१
            </p>
            <p className="klib-loc-hours">
              समय: आइतबार देखि बिहीबार (१०:०० बजे देखि १७:०० बजेसम्म) | शुक्रबार (१०:०० बजे देखि १५:०० बजेसम्म)
            </p>
          </div>

          <div className="klib-location-badges">
            <span className="loc-badge">नेपाल सरकार</span>
            <span className="loc-badge">शिक्षा मन्त्रालय</span>
            <span className="loc-badge">राष्ट्रिय धरोहर</span>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
