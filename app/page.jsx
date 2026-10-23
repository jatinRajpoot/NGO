'use client';

import React, { useState } from 'react';

// --- REAL SOCIAL MEDIA BRAND SVG ICONS ---
function IconFacebook({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
    </svg>
  );
}

function IconInstagram({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
    </svg>
  );
}

function IconYouTube({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
    </svg>
  );
}

function IconLinkedIn({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
    </svg>
  );
}

function IconXTwitter({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
    </svg>
  );
}

function IconWhatsApp({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
    </svg>
  );
}

function IconTelegram({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.121l-6.871 4.326-2.962-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.538-.196 1.006.128.832.942z"/>
    </svg>
  );
}

function IconSnapchat({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12.002 0c-4.148 0-6.91 3.093-6.91 6.58 0 1.58.46 2.84 1.01 3.82-.41.22-.88.46-1.39.73-.78.41-.98.78-.93 1.13.06.39.46.66 1.09.77.77.14 1.48.06 2.06-.21.28 1.4 1.16 2.53 2.5 3.08-.24.3-.57.65-1.01 1.05-.62.56-1.28.94-1.94 1.12-.47.13-.76.38-.72.69.04.3.36.56.9.73.95.3 2.15.35 3.39.15.54.91 1.02 1.47 1.85 1.47.83 0 1.31-.56 1.85-1.47 1.24.2 2.44.15 3.39-.15.54-.17.86-.43.9-.73.04-.31-.25-.56-.72-.69-.66-.18-1.32-.56-1.94-1.12-.44-.4-.77-.75-1.01-1.05 1.34-.55 2.22-1.68 2.5-3.08.58.27 1.29.35 2.06.21.63-.11 1.03-.38 1.09-.77.05-.35-.15-.72-.93-1.13-.51-.27-.98-.51-1.39-.73.55-.98 1.01-2.24 1.01-3.82 0-3.487-2.762-6.58-6.91-6.58z"/>
    </svg>
  );
}

// --- PROFESSIONAL VECTOR UI ICONS ---
function IconLocation({ size = 15, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
      <circle cx="12" cy="10" r="3"></circle>
    </svg>
  );
}

function IconMail({ size = 15, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
      <polyline points="22,6 12,13 2,6"></polyline>
    </svg>
  );
}

function IconPhone({ size = 15, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
    </svg>
  );
}

function IconCheckVerified({ size = 14, color = "#10b981" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
      <polyline points="9 12 11 14 15 10"></polyline>
    </svg>
  );
}

function IconHeart({ size = 15, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
    </svg>
  );
}

function IconClock({ size = 15, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"></circle>
      <polyline points="12 6 12 12 16 14"></polyline>
    </svg>
  );
}

function IconArrowRight({ size = 15, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12"></line>
      <polyline points="12 5 19 12 12 19"></polyline>
    </svg>
  );
}

function IconBell({ size = 14, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
      <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
    </svg>
  );
}

function IconInitiative({ type, size = 22 }) {
  const icons = {
    health: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 12h-4l-3 9L9 3l-3 9H2"></path>
      </svg>
    ),
    education: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 10v6M2 10l10-5 10 5-10 5z"></path>
        <path d="M6 12v5c3 3 9 3 12 0v-5"></path>
      </svg>
    ),
    digital: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
        <line x1="8" y1="21" x2="16" y2="21"></line>
        <line x1="12" y1="17" x2="12" y2="21"></line>
      </svg>
    ),
    community: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
        <circle cx="9" cy="7" r="4"></circle>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
      </svg>
    ),
    women: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="8" r="5"></circle>
        <path d="M12 13v8"></path>
        <path d="M9 18h6"></path>
      </svg>
    ),
    livelihood: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
        <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
      </svg>
    ),
    rural: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
        <polyline points="9 22 9 12 15 12 15 22"></polyline>
      </svg>
    ),
    environment: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"></path>
        <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"></path>
      </svg>
    ),
    govt: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="3" y1="21" x2="21" y2="21"></line>
        <line x1="6" y1="18" x2="6" y2="11"></line>
        <line x1="10" y1="18" x2="10" y2="11"></line>
        <line x1="14" y1="18" x2="14" y2="11"></line>
        <line x1="18" y1="18" x2="18" y2="11"></line>
        <polygon points="12 2 2 7 22 7 12 2"></polygon>
      </svg>
    ),
    survey: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
        <polyline points="14 2 14 8 20 8"></polyline>
        <line x1="16" y1="13" x2="8" y2="13"></line>
        <line x1="16" y1="17" x2="8" y2="17"></line>
        <polyline points="10 9 9 9 8 9"></polyline>
      </svg>
    ),
    youth: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
      </svg>
    ),
    welfare: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
      </svg>
    ),
  };
  return icons[type] || icons.community;
}

export default function Home() {
  const [lang, setLang] = useState('en'); // 'en' or 'hi'
  const [donateModal, setDonateModal] = useState(false);
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    subject: 'Skill Development & Digital Literacy',
    message: '',
  });

  const isHi = lang === 'hi';

  const handleFormSubmit = (e) => {
    e.preventDefault();
    setFormSubmitted(true);
    setTimeout(() => {
      setFormData({ name: '', phone: '', email: '', subject: 'Skill Development & Digital Literacy', message: '' });
      setFormSubmitted(false);
    }, 4000);
  };

  const initiatives = [
    {
      id: '01',
      type: 'health',
      title: isHi ? 'स्वास्थ्य जागरूकता एवं आरोग्य' : 'Health Awareness & Well-Being',
      subtitle: isHi ? 'रोकथाम, पोषण एवं स्वास्थ्य शिक्षा' : 'Preventive Care & Health Education',
      desc: isHi 
        ? 'स्वास्थ्य जागरूकता, निवारक स्वास्थ्य देखभाल शिक्षा, स्वच्छता एवं आवश्यक स्वास्थ्य सूचनाओं का प्रसार कर स्वस्थ व सुरक्षित समाज का निर्माण करना।'
        : 'Promoting health awareness, preventive healthcare education, hygiene, sanitation, and access to essential health-related information to encourage informed decisions and improve community well-being.',
      category: isHi ? 'स्वास्थ्य सेवा पहल' : 'Healthcare Initiative',
    },
    {
      id: '02',
      type: 'education',
      title: isHi ? 'शिक्षा एवं कौशल विकास' : 'Education & Skill Development',
      subtitle: isHi ? 'व्यावसायिक प्रशिक्षण एवं साक्षरता' : 'Vocational Training & Literacy',
      desc: isHi
        ? 'शैक्षिक चेतना, व्यावसायिक कौशल, क्षमता निर्माण और आजीवन सीखने के अवसरों को बढ़ावा देकर व्यक्तिगत क्षमताओं और रोजगार के अवसरों को सुदृढ़ बनाना।'
        : 'Encouraging educational awareness, vocational skills, capacity building, and lifelong learning to enhance individual capabilities and improve access to personal and professional development opportunities.',
      category: isHi ? 'शिक्षा एवं कौशल' : 'Education & Skilling',
    },
    {
      id: '03',
      type: 'digital',
      title: isHi ? 'डिजिटल सशक्तिकरण एवं समावेशन' : 'Digital Empowerment & Inclusion',
      subtitle: isHi ? 'डिजिटल साक्षरता एवं तकनीक ज्ञान' : 'Digital Literacy & Modern Tech',
      desc: isHi
        ? 'डिजिटल साक्षरता, ऑनलाइन सेवाओं की जानकारी और जिम्मेदार तकनीक के उपयोग को बढ़ावा देकर ग्रामीण एवं पिछड़े क्षेत्रों को डिजिटल युग से जोड़ना।'
        : 'Promoting digital literacy, awareness of digital services, and responsible technology adoption to help individuals and underserved communities access information and participate in the evolving digital ecosystem.',
      category: isHi ? 'डिजिटल अभियान' : 'Digital Drive',
    },
    {
      id: '04',
      type: 'community',
      title: isHi ? 'सामुदायिक विकास एवं सामाजिक कल्याण' : 'Community Development & Welfare',
      subtitle: isHi ? 'सामूहिक भागीदारी एवं जन कल्याण' : 'Grassroots Social Welfare',
      desc: isHi
        ? 'सामुदायिक भागीदारी, सामाजिक जागरूकता और जमीनी स्तर की कल्याणकारी गतिविधियों का समर्थन करना जो स्थानीय आवश्यकताओं को पूरा कर समाज को मजबूत बनाती हैं।'
        : 'Supporting community participation, social awareness, grassroots initiatives, and inclusive development activities that address local needs and contribute to stronger, more resilient communities.',
      category: isHi ? 'जमीनी कल्याण' : 'Grassroots Welfare',
    },
    {
      id: '05',
      type: 'women',
      title: isHi ? 'महिला सशक्तिकरण एवं स्वावलंबन' : 'Women Empowerment & Livelihood',
      subtitle: isHi ? 'आत्मनिर्भरता एवं वित्तीय स्वतंत्रता' : 'Self-Reliance & Financial Independence',
      desc: isHi
        ? 'कौशल विकास, आजीविका जागरूकता और स्वयं सहायता पहलों के माध्यम से महिलाओं की सामाजिक व आर्थिक भागीदारी को बढ़ावा देकर उन्हें आत्मनिर्भर बनाना।'
        : 'Encouraging women’s participation in social and economic development through skill-building opportunities, livelihood awareness, capacity development, and initiatives that promote dignity and financial independence.',
      category: isHi ? 'आत्मनिर्भरता' : 'Self-Reliance',
    },
    {
      id: '06',
      type: 'livelihood',
      title: isHi ? 'रोजगार एवं आजीविका सृजन' : 'Livelihood & Employment Awareness',
      subtitle: isHi ? 'उद्यमिता एवं करियर मार्गदर्शन' : 'Career Guidance & Self-Employment',
      desc: isHi
        ? 'आजीविका के नए साधनों, स्व-रोजगार के अवसरों, करियर मार्गदर्शन और आर्थिक आत्मनिर्भरता का समर्थन करने वाली सूचनाओं और प्रशिक्षण का विस्तार।'
        : 'Promoting livelihood awareness, practical vocational training, entrepreneurship, self-employment opportunities, career guidance, and access to income-generating pathways across rural regions.',
      category: isHi ? 'आर्थिक उन्नति' : 'Economic Growth',
    },
    {
      id: '07',
      type: 'rural',
      title: isHi ? 'ग्रामीण विकास एवं समग्र उन्नति' : 'Rural Development & Grassroots Focus',
      subtitle: isHi ? 'ग्रामीण जन-सुविधाएं एवं समावेशन' : 'Grassroots Utilities & Upliftment',
      desc: isHi
        ? 'ग्रामीण विकास, सामाजिक समावेशन और आवश्यक सार्वजनिक सुविधाओं तक बेहतर पहुंच को प्रोत्साहित करने वाली जमीनी पहलों का संचालन व सहयोग।'
        : 'Supporting grassroots initiatives that encourage rural development, community participation, social inclusion, and improved access to essential public utilities and development resources.',
      category: isHi ? 'ग्रामीण सहयोग' : 'Rural Support',
    },
    {
      id: '08',
      type: 'environment',
      title: isHi ? 'पर्यावरण संरक्षण एवं स्वच्छता' : 'Environmental Sustainability',
      subtitle: isHi ? 'वृक्षारोपण एवं स्वच्छ पर्यावरण' : 'Cleanliness & Natural Conservation',
      desc: isHi
        ? 'पर्यावरण शिक्षा, जल एवं प्राकृतिक संसाधन संरक्षण, स्वच्छता (स्वच्छ भारत) और सतत जीवनशैली के प्रति जन-जागरूकता को बढ़ावा देना।'
        : 'Promoting environmental education, conservation awareness, cleanliness (Swachhta), responsible resource use, tree plantation, and sustainable community living practices.',
      category: isHi ? 'पर्यावरण एवं जलवायु' : 'Ecology & Climate',
    },
    {
      id: '09',
      type: 'govt',
      title: isHi ? 'सरकारी कल्याणकारी योजनाएं' : 'Govt. Scheme & Public Linkage',
      subtitle: isHi ? 'पात्रता, आवेदन एवं जन-सुविधाएं' : 'Public Welfare Eligibility Linkage',
      desc: isHi
        ? 'प्रासंगिक सरकारी कल्याणकारी योजनाओं, सार्वजनिक सेवाओं, पात्रता मानदंडों और आवेदन प्रक्रियाओं के बारे में जागरूकता फैलाकर अंतिम व्यक्ति तक लाभ पहुंचाना।'
        : 'Creating awareness about relevant government welfare schemes, public services, eligibility requirements, and application procedures to ensure benefits reach last-mile citizens.',
      category: isHi ? 'योजना समावेशन' : 'Welfare Linkage',
    },
    {
      id: '10',
      type: 'survey',
      title: isHi ? 'सामाजिक सर्वेक्षण एवं शोध' : 'Survey, Research & Social Assessment',
      subtitle: isHi ? 'तथ्यात्मक आंकलन एवं विश्लेषण' : 'Field Assessment & Social Analysis',
      desc: isHi
        ? 'स्थानीय चुनौतियों की पहचान करने और लक्षित सामाजिक विकास गतिविधियों को दिशा देने के लिए सामुदायिक सर्वेक्षण और तथ्यात्मक आंकलन करना।'
        : 'Supporting community-level surveys, factual data collection initiatives, and need assessments to help identify grassroots challenges and guide targeted social development actions.',
      category: isHi ? 'शोध एवं प्रभाव' : 'Data & Impact',
    },
    {
      id: '11',
      type: 'youth',
      title: isHi ? 'युवा सशक्तिकरण एवं नेतृत्व' : 'Youth Empowerment & Leadership',
      subtitle: isHi ? 'व्यक्तित्व निर्माण एवं समाज सेवा' : 'Youth Leadership & Nation Building',
      desc: isHi
        ? 'युवाओं में नेतृत्व कौशल, व्यक्तित्व विकास, राष्ट्र निर्माण और सामाजिक गतिविधियों में सक्रिय व रचनात्मक भागीदारी को प्रोत्साहित करना।'
        : 'Fostering youth participation, leadership skills, personal development, volunteering, and constructive involvement in nation-building and community transformation initiatives.',
      category: isHi ? 'युवा शक्ति' : 'Next-Gen Youth',
    },
    {
      id: '12',
      type: 'welfare',
      title: isHi ? 'सामाजिक समरसता एवं समग्र विकास' : 'Social Welfare & Equal Dignity',
      subtitle: isHi ? 'समान गरिमा एवं मानवीय सुरक्षा' : 'Social Inclusion & Equal Dignity',
      desc: isHi
        ? 'समाज के वंचित, जरूरतमंद और कमजोर वर्गों के लिए सम्मान, समान अवसर, सामाजिक सुरक्षा और सामुदायिक देखभाल को मजबूती प्रदान करना।'
        : 'Championing dignity, equal opportunities, social cohesion, and protective community care for underserved, marginalized, and vulnerable sections of society.',
      category: isHi ? 'समावेशी समाज' : 'Inclusive Society',
    },
  ];

  const galleryItems = [
    {
      title: isHi ? 'डिजिटल कौशल केंद्र' : 'Digital Skilling Bootcamp',
      sub: isHi ? 'रानीगंज, अररिया केंद्र' : 'Raniganj, Araria Skill Centre',
      badge: isHi ? 'कौशल अभियान' : 'Skill Drive',
      bg: 'linear-gradient(135deg, #1e3a8a, #0f172a)',
      type: 'digital',
    },
    {
      title: isHi ? 'करियर व व्यावसायिक मार्गदर्शन' : 'Vocational Counseling Drive',
      sub: isHi ? '200+ ग्रामीण युवाओं का मार्गदर्शन' : 'Guiding 200+ rural youths',
      badge: isHi ? 'युवा प्रभाव' : 'Youth Impact',
      bg: 'linear-gradient(135deg, #b45309, #78350f)',
      type: 'education',
    },
    {
      title: isHi ? 'निःशुल्क स्वास्थ्य जागरूकता शिविर' : 'Community Health Awareness Camp',
      sub: isHi ? 'निवारक स्वास्थ्य एवं परामर्श' : 'Preventive healthcare & guidance',
      badge: isHi ? 'स्वास्थ्य सेवा' : 'Healthcare',
      bg: 'linear-gradient(135deg, #065f46, #022c22)',
      type: 'health',
    },
    {
      title: isHi ? 'महिला स्वयं सहायता कार्यशाला' : 'Women SHG & Skill Workshop',
      sub: isHi ? 'आजीविका एवं वित्तीय साक्षरता' : 'Livelihood & financial literacy',
      badge: isHi ? 'महिला उत्थान' : 'Empowerment',
      bg: 'linear-gradient(135deg, #831843, #500724)',
      type: 'women',
    },
  ];

  return (
    <div className="site-wrapper">
      {/* 1. TOP UTILITY BAR (Exact layout as per WhatsApp image) */}
      <div className="top-utility-bar">
        <div className="container top-utility-inner">
          <div className="top-utility-left">
            <span className="top-info-item">
              <IconLocation size={13} color="#f59e0b" />
              Raniganj, Araria, Bihar (NH 327e)
            </span>
            <span className="top-info-item">
              <IconMail size={13} color="#f59e0b" />
              foundationgsdd@gmail.com
            </span>
            <span className="top-info-item">
              <IconPhone size={13} color="#f59e0b" />
              +91 9546752915
            </span>
          </div>

          <div className="top-utility-right">
            <span className="top-badge-item">
              <IconCheckVerified size={12} color="#f59e0b" />
              CIN: U88900BR2026NPL086114
            </span>
            <span className="top-badge-item">
              <IconCheckVerified size={12} color="#f59e0b" />
              NITI Aayog: BR/2026/1140209
            </span>

            {/* Language Switcher */}
            <div className="lang-toggle-box" title="Change Language / भाषा बदलें">
              <button
                type="button"
                className={`lang-toggle-btn ${!isHi ? 'active' : ''}`}
                onClick={() => setLang('en')}
              >
                EN
              </button>
              <button
                type="button"
                className={`lang-toggle-btn ${isHi ? 'active' : ''}`}
                onClick={() => setLang('hi')}
              >
                हिन्दी
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 2. MAIN WHITE INSTITUTIONAL HEADER (Exact layout as per WhatsApp image) */}
      <header className="main-header-white">
        <div className="container main-header-inner">
          <div className="header-brand-left">
            <img
              src="/logo.png"
              alt="GSDD Foundation Official Logo"
              className="header-logo"
            />
            <div className="header-brand-text">
              <h1 className={isHi ? "header-hi-title" : "header-en-title"}>
                {isHi
                  ? 'ग्लोबल स्किल्स & डिजिटल डेवलपमेंट फाउंडेशन'
                  : 'GLOBAL SKILLS & DIGITAL DEVELOPMENT FOUNDATION'}
              </h1>
              <p className="header-subtext">
                {isHi
                  ? 'एक वैधानिक सेक्शन 8 गैर-लाभकारी संगठन • कॉर्पोरेट कार्य मंत्रालय (MCA), भारत सरकार'
                  : 'A Statutory Section 8 Non-Profit Organization • Ministry of Corporate Affairs (MCA), Govt. of India'}
              </p>
              <div className="header-badges-row">
                <span className="mca-badge">
                  <IconCheckVerified size={11} color="#059669" />
                  {isHi ? 'सेक्शन 8 लाइसेंस प्राप्त' : 'Section 8 Licensed'}
                </span>
                <span className="mca-badge">
                  <IconCheckVerified size={11} color="#059669" />
                  {isHi ? 'नीति आयोग दर्पण सत्यापित' : 'NITI Aayog DARPAN Verified'}
                </span>
                <span className="mca-badge">
                  <IconCheckVerified size={11} color="#059669" />
                  {isHi ? '12A एवं 80G कर छूट' : '12A & 80G Tax Exemption'}
                </span>
              </div>
            </div>
          </div>

          <div className="header-contact-right">
            <div className="header-contact-box">
              <div className="header-phone">
                <IconPhone size={16} color="#d97706" />
                +91 9546752915
              </div>
              <div className="header-email">foundationgsdd@gmail.com</div>
              <div className="header-location">
                {isHi
                  ? 'डिजिटल भारत सशक्तिकरण • रानीगंज, अररिया, बिहार'
                  : 'Empowering Digital India • Raniganj, Bihar'}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* 3. HORIZONTAL NAV BAR (Dark Navy - Matching WhatsApp image) */}
      <nav className="navbar-dark">
        <div className="container navbar-inner">
          <ul className="nav-links-list">
            <li className="active">
              <a href="#">{isHi ? 'मुखपृष्ठ' : 'Home'}</a>
            </li>
            <li>
              <a href="#about">{isHi ? 'संस्था परिचय' : 'About Us'}</a>
            </li>
            <li>
              <a href="#initiatives">{isHi ? '12 कार्य क्षेत्र' : '12 Core Initiatives'}</a>
            </li>
            <li>
              <a href="#gallery">{isHi ? 'समाजिक बदलाव' : 'Impact & Transformation'}</a>
            </li>
            <li>
              <a href="#legal-vault">{isHi ? 'वैधानिक साख' : 'Statutory Vault'}</a>
            </li>
            <li>
              <a href="#leadership">{isHi ? 'नेतृत्व' : 'Leadership'}</a>
            </li>
            <li>
              <a href="#contact">{isHi ? 'संपर्क करें' : 'Contact Us'}</a>
            </li>
          </ul>

          <button
            onClick={() => setDonateModal(true)}
            className="btn-donate-nav"
          >
            <IconHeart size={15} />
            {isHi ? 'दान एवं सहयोग' : 'Donate Now'}
          </button>
        </div>
      </nav>

      {/* 4. NOTICE TICKER BAR (Amber/Yellow beneath navbar) */}
      <div className="notice-ticker-bar">
        <div className="container ticker-inner">
          <span className="ticker-label">
            <IconBell size={12} color="#ffffff" />
            {isHi ? 'सूचना' : 'NOTICES'}
          </span>
          <span className="ticker-text">
            {isHi
              ? 'GSDD फाउंडेशन कंपनी अधिनियम 2013 (MCA, भारत सरकार) की धारा 8 के तहत विधिवत पंजीकृत है • आयकर धारा 80G एवं 12A प्रमाणन प्राप्त • नीति आयोग DARPAN ID: BR/2026/1140209।'
              : 'GSDD Foundation is incorporated under Section 8 of the Companies Act 2013 (MCA, Govt. of India) • Eligible for Section 80G Tax Exemption & 12A Certified • NITI Aayog DARPAN Verified (BR/2026/1140209).'}
          </span>
        </div>
      </div>

      {/* Hero Section with Underprivileged Children Background & Left Alignment */}
      <section className="hero-section">
        <div className="container">
          <div className="hero-inner-left">
            <div className="hindi-badge">
              <IconCheckVerified size={15} color="#fbbf24" />
              {isHi ? 'ग्लोबल स्किल्स & डिजिटल डेवलपमेंट फाउंडेशन' : 'Global Skills & Digital Development Foundation'}
            </div>

            <h1 className="hero-title">
              {isHi ? (
                <>
                  लोगों का सशक्तिकरण।<br />
                  <span>समुदायों का समग्र उत्थान।</span>
                </>
              ) : (
                <>
                  Empowering People.<br />
                  <span>Transforming Communities.</span>
                </>
              )}
            </h1>

            <p className="hero-desc">
              {isHi
                ? 'ग्लोबल स्किल्स & डिजिटल डेवलपमेंट फाउंडेशन (GSDD FOUNDATION) डिजिटल साक्षरता, व्यावसायिक कौशल प्रशिक्षण, स्वास्थ्य जागरूकता और स्थायी आजीविका के माध्यम से वंचित समुदायों को सशक्त बनाने और विकास के नए अवसरों से जोड़ने के लिए पूर्णतः समर्पित है।'
                : 'Global Skills & Digital Development Foundation (GSDD FOUNDATION) is committed to bridging the gap between underserved communities and transformative opportunities through digital literacy, vocational training, healthcare awareness, and sustainable livelihood.'}
            </p>

            <div className="hero-cta">
              <a href="#initiatives" className="btn btn-primary">
                {isHi ? '12 कार्य क्षेत्र देखें' : 'Explore 12 Initiatives'}
                <IconArrowRight size={16} />
              </a>
              <a href="#legal-vault" className="btn btn-outline">
                <IconCheckVerified size={16} color="#fbbf24" />
                {isHi ? 'सरकारी साख एवं अनुपालन' : 'Official Credentials & Compliance'}
              </a>
              <button
                onClick={() => setDonateModal(true)}
                className="btn btn-outline"
                style={{ borderColor: '#f59e0b', color: '#fbbf24' }}
              >
                <IconHeart size={16} color="#fbbf24" />
                {isHi ? '80G कर छूट के साथ दान' : '80G Tax Exemption Support'}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Ribbon */}
      <div className="stats-ribbon">
        <div className="container stats-grid">
          <div className="stat-item">
            <div className="stat-num">12<span>+</span></div>
            <div className="stat-text">{isHi ? 'प्रमुख विकास पहल' : 'Core Development Initiatives'}</div>
          </div>
          <div className="stat-item">
            <div className="stat-num">Pan<span>-India</span></div>
            <div className="stat-text">{isHi ? 'ग्रामीण एवं जमीनी विस्तार' : 'Grassroots & Rural Outreach'}</div>
          </div>
          <div className="stat-item">
            <div className="stat-num">100<span>%</span></div>
            <div className="stat-text">{isHi ? 'पूर्ण पारदर्शी एवं पंजीकृत' : 'Non-Profit Statutory Compliance'}</div>
          </div>
          <div className="stat-item">
            <div className="stat-num">Digital<span>-First</span></div>
            <div className="stat-text">{isHi ? 'डिजिटल साक्षरता अभियान' : 'Skill & Capacity Empowerment'}</div>
          </div>
        </div>
      </div>

      {/* About Section */}
      <section id="about" className="section section-bg-light">
        <div className="container about-grid">
          <div className="about-card-featured">
            <img
              src="/logo.png"
              alt="GSDD Foundation"
              className="about-logo"
            />
            <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#0f172a' }}>
              GSDD FOUNDATION
            </h3>
            <p style={{ color: '#d97706', fontWeight: 600, fontSize: '0.9rem', marginBottom: '14px' }}>
              {isHi ? 'सेक्शन 8 गैर-लाभकारी संगठन' : 'Section 8 Non-Profit Organization'}
            </p>
            <p style={{ fontSize: '0.88rem', color: '#64748b', lineHeight: 1.6 }}>
              {isHi
                ? 'कंपनी अधिनियम के अंतर्गत पंजीकृत, पूरे भारत में शिक्षा, व्यावसायिक कौशल, स्वास्थ्य और ग्रामीण कल्याण के लिए समर्पित।'
                : 'Established under the Companies Act, dedicated to nationwide educational awareness, vocational skilling, healthcare, and sustainable grassroots welfare.'}
            </p>
            <div className="about-pills">
              <span className="about-pill">
                <IconCheckVerified size={12} color="#d97706" /> {isHi ? 'सत्यनिष्ठा' : 'Integrity'}
              </span>
              <span className="about-pill">
                <IconCheckVerified size={12} color="#d97706" /> {isHi ? 'समावेशिता' : 'Inclusivity'}
              </span>
              <span className="about-pill">
                <IconCheckVerified size={12} color="#d97706" /> {isHi ? 'जवाबदेही' : 'Accountability'}
              </span>
              <span className="about-pill">
                <IconCheckVerified size={12} color="#d97706" /> {isHi ? 'सहयोग' : 'Collaboration'}
              </span>
            </div>
          </div>

          <div className="about-content">
            <span className="section-tag">
              <IconInitiative type="community" size={16} />
              {isHi ? 'फाउंडेशन का परिचय' : 'About Our Foundation'}
            </span>
            <h2 className="section-title">
              {isHi ? 'वंचित भारत के लिए नए अवसरों का सृजन' : 'Bridging Opportunity Gaps for Underserved India'}
            </h2>
            <p className="section-desc" style={{ marginBottom: '18px' }}>
              <strong>{isHi ? 'ग्लोबल स्किल्स & डिजिटल डेवलपमेंट फाउंडेशन (GSDD FOUNDATION)' : 'Global Skills & Digital Development Foundation (GSDD FOUNDATION)'}</strong> {isHi
                ? 'एक गैर-लाभकारी संगठन है जो सामाजिक उत्थान, शैक्षिक जागरूकता, स्वास्थ्य चेतना, डिजिटल साक्षरता, कौशल विकास, महिला सशक्तिकरण, आजीविका के अवसर, पर्यावरण संरक्षण और सामुदायिक कल्याण के लिए समर्पित है।'
                : 'is a non-profit organization dedicated to advancing social development, educational awareness, healthcare awareness, digital literacy, skill development, women empowerment, livelihood opportunities, environmental sustainability, and community welfare.'}
            </p>
            <p className="section-desc" style={{ marginBottom: '18px' }}>
              {isHi
                ? 'हमारा फाउंडेशन ज्ञान, आवश्यक सूचनाओं, कौशल आधारित शिक्षा, रोजगारोन्मुख विकास तथा सरकारी कल्याणकारी योजनाओं और सार्वजनिक सेवाओं की जानकारी प्रसारित करके वंचित समुदायों को मुख्यधारा से जोड़ता है।'
                : 'Our foundation strives to bridge the gap between underserved communities and meaningful opportunities by promoting access to knowledge, essential information, skill-based learning, employment-oriented development, and awareness of applicable government welfare schemes and public services.'}
            </p>
            <p className="section-desc" style={{ marginBottom: '24px' }}>
              {isHi
                ? 'हमारा दृढ़ विश्वास है कि स्थायी विकास की शुरुआत सशक्त नागरिकों और जागरूक समाज से होती है। हम आत्मनिर्भरता, सामुदायिक भागीदारी और डिजिटल समावेश को बढ़ावा देकर जीवन स्तर में सुधार लाने के लिए निरंतर प्रयासरत हैं।'
                : 'We believe that sustainable development begins with empowered individuals and informed communities. With this vision, we aim to facilitate initiatives that encourage self-reliance, strengthen community participation, promote digital inclusion, and contribute to improving the overall quality of life.'}
            </p>
            <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
              <a href="#initiatives" className="btn btn-dark">
                {isHi ? '12 कार्य क्षेत्र देखें' : 'Explore 12 Work Sectors'}
                <IconArrowRight size={16} />
              </a>
              <a href="#contact" className="btn btn-outline" style={{ color: '#0f172a', borderColor: '#cbd5e1' }}>
                {isHi ? 'स्वयंसेवक / साझेदार बनें' : 'Join as Volunteer / Partner'}
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Purpose, Mission & Vision */}
      <section id="mission-vision" className="section">
        <div className="container">
          <div className="section-header">
            <span className="section-tag">
              <IconInitiative type="survey" size={16} />
              {isHi ? 'उद्देश्य एवं वैचारिक दिशा' : 'Purpose & Strategic Compass'}
            </span>
            <h2 className="section-title">
              {isHi ? 'स्थायी सामाजिक बदलाव के प्रेरक सिद्धांत' : 'Guiding Principles for Lasting Social Transformation'}
            </h2>
            <p className="section-desc">
              {isHi
                ? 'GSDD फाउंडेशन की प्रत्येक पहल समानता, पारदर्शिता और समग्र ग्रामीण विकास के प्रति हमारी अटूट निष्ठा पर आधारित है।'
                : 'Every initiative at GSDD Foundation is anchored in our commitment to equity, transparency, and sustainable community advancement.'}
            </p>
          </div>

          <div className="mv-grid">
            <div className="mv-card mission">
              <span className="mv-badge mission">
                <IconCheckVerified size={13} color="#b45309" />
                {isHi ? 'हमारा मिशन' : 'OUR MISSION'}
              </span>
              <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', marginBottom: '12px' }}>
                {isHi ? 'अवसर सृजन। सामुदायिक सशक्तिकरण। जीवन रूपांतरण।' : 'Creating Opportunities. Empowering Communities. Transforming Lives.'}
              </h3>
              <p style={{ color: '#475569', fontSize: '0.95rem', lineHeight: 1.7, marginBottom: '16px' }}>
                {isHi
                  ? 'ग्लोबल स्किल्स & डिजिटल डेवलपमेंट फाउंडेशन का मुख्य उद्देश्य शिक्षा, सामाजिक कल्याण, जन-जागरूकता, युवा सशक्तिकरण और समावेशी विकास को गति देकर समाज की समग्र उन्नति में योगदान देना है।'
                  : 'At GLOBAL SKILLS & DIGITAL DEVELOPMENT FOUNDATION, our mission is to contribute to the sustainable development of society by promoting education, social welfare, community empowerment, public awareness, and inclusive growth.'}
              </p>
              <p style={{ color: '#64748b', fontSize: '0.9rem', lineHeight: 1.6 }}>
                {isHi
                  ? 'सामुदायिक सहभागिता, शैक्षिक पहलों, सर्वेक्षण व जागरूकता कार्यक्रमों और रणनीतिक साझेदारी के जरिए हम सकारात्मक बदलाव लाने के लिए समर्पित हैं।'
                  : 'Through community engagement, educational initiatives, survey and awareness projects, youth empowerment, skill development, and strategic collaboration, we strive to support positive social change and connect people with dignity, equality, and opportunity.'}
              </p>
            </div>

            <div className="mv-card vision">
              <span className="mv-badge vision">
                <IconCheckVerified size={13} color="#1d4ed8" />
                {isHi ? 'हमारा दृष्टिकोण' : 'OUR VISION'}
              </span>
              <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', marginBottom: '12px' }}>
                {isHi ? 'समावेशी, सशक्त और आत्मनिर्भर समाज का निर्माण' : 'Building an Inclusive, Empowered, and Sustainable Society'}
              </h3>
              <p style={{ color: '#475569', fontSize: '0.95rem', lineHeight: 1.7, marginBottom: '16px' }}>
                {isHi
                  ? 'हम एक ऐसे समाज की कल्पना करते हैं जहां प्रत्येक व्यक्ति को गरिमा, समानता और सम्मान के साथ आगे बढ़ने के समान अवसर मिलें, और शिक्षा व तकनीक हर नागरिक तक पहुंचे।'
                  : 'We envision a society where every individual has the opportunity to grow, thrive, and live with dignity. Where education, digital access, and social responsibility serve as the strong foundation for community advancement.'}
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginTop: '16px' }}>
                <div style={{ background: '#f8fafc', padding: '10px 14px', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <IconInitiative type="youth" size={16} /> {isHi ? 'सबके लिए सशक्तिकरण' : 'Empowerment for All'}
                </div>
                <div style={{ background: '#f8fafc', padding: '10px 14px', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <IconInitiative type="education" size={16} /> {isHi ? 'सतत शिक्षा एवं ज्ञान' : 'Lifelong Learning'}
                </div>
                <div style={{ background: '#f8fafc', padding: '10px 14px', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <IconInitiative type="welfare" size={16} /> {isHi ? 'समानता एवं समावेशन' : 'Equality & Inclusion'}
                </div>
                <div style={{ background: '#f8fafc', padding: '10px 14px', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <IconInitiative type="environment" size={16} /> {isHi ? 'टिकाऊ व सतत विकास' : 'Sustainable Action'}
                </div>
              </div>
            </div>
          </div>

          <div className="goal-banner">
            <div>
              <span style={{ color: '#f59e0b', fontWeight: 700, fontSize: '0.85rem', letterSpacing: '1px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <IconInitiative type="youth" size={16} /> {isHi ? 'रणनीतिक लक्ष्य' : 'STRATEGIC GOAL'}
              </span>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 800, marginTop: '6px', marginBottom: '10px' }}>
                {isHi ? 'समावेशी विकास एवं सतत ग्रामीण उत्थान को बढ़ावा' : 'Advancing Inclusive Growth and Sustainable Community Development'}
              </h3>
              <p style={{ color: '#cbd5e1', fontSize: '0.95rem', maxWidth: '850px' }}>
                {isHi
                  ? 'कौशल संवर्धन, स्वास्थ्य रक्षा, डिजिटल समावेशन और आजीविका के नए साधनों द्वारा ग्रामीण व पिछड़े क्षेत्रों का सर्वांगीण विकास सुनिश्चित करना।'
                  : 'Empowering rural and underserved communities through skill development, healthcare awareness, digital inclusion, livelihood enhancement, and facilitating access to essential public welfare programs across India.'}
              </p>
            </div>
            <a
              href="#initiatives"
              className="btn btn-primary"
              style={{ whiteSpace: 'nowrap', alignSelf: 'center' }}
            >
              {isHi ? 'सभी 12 क्षेत्र देखें' : 'See All 12 Sectors'}
              <IconArrowRight size={16} />
            </a>
          </div>
        </div>
      </section>

      {/* 12 Core Development Initiatives */}
      <section id="initiatives" className="section section-bg-light">
        <div className="container">
          <div className="section-header">
            <span className="section-tag">
              <IconInitiative type="community" size={16} />
              {isHi ? 'प्रमुख कार्य क्षेत्र' : 'Core Action Areas'}
            </span>
            <h2 className="section-title">
              {isHi ? '12 मुख्य विकास पहल' : '12 Core Development Initiatives'}
            </h2>
            <p className="section-desc">
              {isHi
                ? 'हमारे वैधानिक चार्टर के अनुसार बिहार और पूरे देश के ग्रामीण व पिछड़े क्षेत्रों के विकास के 12 मुख्य आधार स्तंभ।'
                : 'From our official foundational charter, our work addresses the essential pillars of grassroots community growth across Bihar and pan-India.'}
            </p>
          </div>

          <div className="initiatives-grid">
            {initiatives.map((item) => (
              <div key={item.id} className="initiative-card">
                <div className="initiative-top">
                  <span className="initiative-num">{item.id}</span>
                  <div className="initiative-icon-box">
                    <IconInitiative type={item.type} size={22} />
                  </div>
                </div>
                <h3 className="initiative-title">{item.title}</h3>
                <div className="initiative-subtitle">
                  {item.subtitle}
                </div>
                <p className="initiative-desc">{item.desc}</p>
                <div className="initiative-footer">
                  <span>{item.category}</span>
                  <span style={{ fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    {isHi ? 'मुख्य क्षेत्र' : 'Focus Area'} <IconArrowRight size={13} />
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Moments of Transformation / Gallery */}
      <section id="gallery" className="section">
        <div className="container">
          <div className="section-header">
            <span className="section-tag">
              <IconInitiative type="education" size={16} />
              {isHi ? 'जमीनी प्रभाव' : 'Grassroots Impact'}
            </span>
            <h2 className="section-title">
              {isHi ? 'समाजिक बदलाव की झलकियां' : 'Moments of Transformation'}
            </h2>
            <p className="section-desc">
              {isHi
                ? 'जमीनी स्तर पर आयोजित प्रशिक्षण शिविर, कंप्यूटर कार्यशालाएं और स्वास्थ्य व परामर्श अभियान।'
                : 'Dedicated field initiatives, learning camps, community counseling, and awareness drives bringing real change to lives.'}
            </p>
          </div>

          <div className="gallery-grid">
            {galleryItems.map((item, idx) => (
              <div key={idx} className="gallery-card">
                <div
                  className="gallery-img-box"
                  style={{
                    background: item.bg,
                  }}
                >
                  <span className="gallery-badge">{item.badge}</span>
                  <div style={{ marginBottom: '10px' }}>
                    <IconInitiative type={item.type} size={38} />
                  </div>
                  <div style={{ fontSize: '0.88rem', fontWeight: 600, opacity: 0.9 }}>
                    GSDD Foundation Field Project
                  </div>
                </div>
                <div className="gallery-info">
                  <h4 className="gallery-title">{item.title}</h4>
                  <p className="gallery-sub">{item.sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Statutory Credentials & Legal Vault */}
      <section id="legal-vault" className="legal-vault">
        <div className="container">
          <div className="section-header" style={{ marginBottom: '45px' }}>
            <span className="section-tag" style={{ color: '#fbbf24' }}>
              <IconCheckVerified size={15} color="#fbbf24" />
              {isHi ? 'पारदर्शिता एवं कानूनी मान्यता' : 'Transparency & Regulatory Compliance'}
            </span>
            <h2 className="section-title" style={{ color: '#ffffff' }}>
              {isHi ? 'सरकारी वैधानिक साख एवं कानूनी विवरण' : 'Official Statutory Credentials & Legal Vault'}
            </h2>
            <p className="section-desc" style={{ color: '#94a3b8' }}>
              {isHi
                ? 'ग्लोबल स्किल्स & डिजिटल डेवलपमेंट फाउंडेशन कॉर्पोरेट कार्य मंत्रालय (MCA), नीति आयोग तथा आयकर विभाग द्वारा पंजीकृत व प्रमाणित सेक्शन 8 संस्था है।'
                : 'Global Skills & Digital Development Foundation is a fully compliant Section 8 Non-Profit Organization registered under the Ministry of Corporate Affairs, NITI Aayog, and Income Tax Department.'}
            </p>
          </div>

          <div className="vault-grid">
            <div className="vault-card">
              <div className="vault-top-row">
                <span className="vault-tag">{isHi ? 'सीआईएन / पंजीकरण संख्या' : 'CIN / Registration No.'}</span>
                <IconCheckVerified size={15} color="#10b981" />
              </div>
              <div className="vault-val">U88900BR2026NPL086114</div>
              <div className="vault-desc">{isHi ? 'कॉर्पोरेट कार्य मंत्रालय (MCA), भारत सरकार' : 'Govt. of India, Ministry of Corporate Affairs (MCA)'}</div>
            </div>

            <div className="vault-card">
              <div className="vault-top-row">
                <span className="vault-tag">{isHi ? 'नीति आयोग दर्पण आईडी' : 'NITI Aayog DARPAN ID'}</span>
                <IconCheckVerified size={15} color="#10b981" />
              </div>
              <div className="vault-val">BR/2026/1140209</div>
              <div className="vault-desc">{isHi ? 'सत्यापित गैर-लाभकारी पोर्टल, भारत सरकार' : 'Verified Non-Profit Portal, Govt. of India'}</div>
            </div>

            <div className="vault-card">
              <div className="vault-top-row">
                <span className="vault-tag">{isHi ? 'धारा 12A प्रमाणन' : 'Section 12A Certified'}</span>
                <IconCheckVerified size={15} color="#10b981" />
              </div>
              <div className="vault-val">AANCG1860EE20261</div>
              <div className="vault-desc">{isHi ? 'आयकर विभाग पंजीकरण' : 'Income Tax Department Registration'}</div>
            </div>

            <div className="vault-card">
              <div className="vault-top-row">
                <span className="vault-tag">{isHi ? 'धारा 80G कर छूट' : 'Section 80G Tax Exemption'}</span>
                <IconCheckVerified size={15} color="#10b981" />
              </div>
              <div className="vault-val">AANCG1860EF20261</div>
              <div className="vault-desc">{isHi ? 'दाताओं को आयकर धारा 80G के तहत 50% छूट' : '50% Tax Benefits for Donors under Section 80G'}</div>
            </div>

            <div className="vault-card">
              <div className="vault-top-row">
                <span className="vault-tag">{isHi ? 'पैन (PAN) संख्या' : 'PAN Number'}</span>
                <IconCheckVerified size={15} color="#10b981" />
              </div>
              <div className="vault-val">AANCG1860E</div>
              <div className="vault-desc">{isHi ? 'स्थायी खाता संख्या (भारत सरकार)' : 'Permanent Account Number (Govt. of India)'}</div>
            </div>

            <div className="vault-card">
              <div className="vault-top-row">
                <span className="vault-tag">{isHi ? 'टैन (TAN) संख्या' : 'TAN Number'}</span>
                <IconCheckVerified size={15} color="#10b981" />
              </div>
              <div className="vault-val">PTNG16847</div>
              <div className="vault-desc">{isHi ? 'कर कटौती एवं संग्रह खाता संख्या' : 'Tax Deduction & Collection Account Number'}</div>
            </div>

            <div className="vault-card">
              <div className="vault-top-row">
                <span className="vault-tag">{isHi ? 'एमएसएमई (MSME) पंजीकरण' : 'MSME Registration'}</span>
                <IconCheckVerified size={15} color="#10b981" />
              </div>
              <div className="vault-val">UDYAM-BR-01-0061552</div>
              <div className="vault-desc">{isHi ? 'सूक्ष्म, लघु एवं मध्यम उद्यम मंत्रालय' : 'Ministry of Micro, Small and Medium Enterprises'}</div>
            </div>

            <div className="vault-card">
              <div className="vault-top-row">
                <span className="vault-tag">{isHi ? 'वैधानिक श्रेणी' : 'Statutory Category'}</span>
                <IconCheckVerified size={15} color="#38bdf8" />
              </div>
              <div className="vault-val" style={{ color: '#38bdf8' }}>{isHi ? 'सेक्शन 8 कंपनी' : 'SECTION 8 COMPANY'}</div>
              <div className="vault-desc">{isHi ? 'सामाजिक कल्याण, गैर-लाभकारी संगठन' : 'Social Welfare, Non-Profit Organization'}</div>
            </div>
          </div>
        </div>
      </section>

      {/* Executive Leadership */}
      <section id="leadership" className="section section-bg-light">
        <div className="container">
          <div className="section-header">
            <span className="section-tag">
              <IconInitiative type="community" size={16} />
              {isHi ? 'मार्गदर्शन एवं नेतृत्व' : 'Governance & Guidance'}
            </span>
            <h2 className="section-title">
              {isHi ? 'संस्थापक एवं नेतृत्व' : 'Executive Leadership'}
            </h2>
            <p className="section-desc">
              {isHi
                ? 'समुदाय के सशक्तिकरण और जमीनी स्तर पर डिजिटल क्रांति के लिए समर्पित हमारे संस्थापक।'
                : 'Dedicated founders steering the foundation toward community empowerment and grassroots digital transformation.'}
            </p>
          </div>

          <div className="leadership-grid">
            <div className="leader-card">
              <div className="leader-avatar">MB</div>
              <div className="leader-info">
                <h4>Manoj Kumar Bishwas</h4>
                <div className="leader-role">{isHi ? 'संस्थापक / सीईओ' : 'FOUNDER / CEO'}</div>
                <p className="leader-quote">
                  {isHi
                    ? '“हमारा संकल्प है कि प्रत्येक नागरिक को वह कौशल, डिजिटल साक्षरता और अवसर मिले जिससे वह सम्मानपूर्वक आत्मनिर्भर जीवन जी सके।”'
                    : '“Our goal is to ensure that every individual in our communities has the skilling, digital literacy, and opportunities required to lead a dignified and self-reliant life.”'}
                </p>
              </div>
            </div>

            <div className="leader-card">
              <div className="leader-avatar" style={{ background: 'linear-gradient(135deg, #2563eb, #1d4ed8)' }}>AK</div>
              <div className="leader-info">
                <h4>Arvind Kumar</h4>
                <div className="leader-role">{isHi ? 'संस्थापक / प्रबंध निदेशक' : 'FOUNDER / MD'}</div>
                <p className="leader-quote">
                  {isHi
                    ? '“संस्थाओं, CSR साझेदारों और ग्रामीण समुदाय के सम्मिलित प्रयासों से ही हम स्थायी सामाजिक प्रगति और बदलाव का निर्माण कर सकते हैं।”'
                    : '“Through collaborative action with institutions, CSR partners, and grassroots communities, we create sustainable pathways of progress and lasting social impact.”'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Connect & Contact Section */}
      <section id="contact" className="section">
        <div className="container">
          <div className="contact-grid">
            {/* Info Panel */}
            <div className="contact-info-panel">
              <span style={{ color: '#fbbf24', fontWeight: 700, fontSize: '0.85rem' }}>
                {isHi ? 'संपर्क सूत्र' : 'GET IN TOUCH'}
              </span>
              <h3>{isHi ? 'GSDD फाउंडेशन से जुड़ें' : 'Connect with GSDD Foundation'}</h3>
              <p style={{ color: '#cbd5e1', fontSize: '0.95rem', lineHeight: 1.6 }}>
                {isHi
                  ? 'चाहे आप CSR सहयोग, स्वयंसेवा, कौशल प्रशिक्षण या सामाजिक दान के लिए संपर्क करना चाहते हों, हमारी टीम आपकी सहायता के लिए तैयार है।'
                  : 'Whether you want to partner for CSR initiatives, volunteer, register for training, or support our social mission, our team is here to assist.'}
              </p>

              <div className="contact-items">
                <div className="contact-item">
                  <div className="contact-icon-circle">
                    <IconLocation size={20} color="#fbbf24" />
                  </div>
                  <div>
                    <strong style={{ display: 'block', fontSize: '0.9rem', color: '#f8fafc' }}>
                      {isHi ? 'प्रधान कार्यालय' : 'Head Office'}
                    </strong>
                    <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
                      Dhak Bangla Near Maa Ashawaar Mandir Raniganj NH 327e Araria Bihar
                    </span>
                  </div>
                </div>

                <div className="contact-item">
                  <div className="contact-icon-circle">
                    <IconPhone size={20} color="#fbbf24" />
                  </div>
                  <div>
                    <strong style={{ display: 'block', fontSize: '0.9rem', color: '#f8fafc' }}>
                      {isHi ? 'फोन एवं व्हाट्सएप हेल्पलाइन' : 'Phone & WhatsApp Helpline'}
                    </strong>
                    <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
                      +91 9546752915
                    </span>
                  </div>
                </div>

                <div className="contact-item">
                  <div className="contact-icon-circle">
                    <IconMail size={20} color="#fbbf24" />
                  </div>
                  <div>
                    <strong style={{ display: 'block', fontSize: '0.9rem', color: '#f8fafc' }}>
                      {isHi ? 'आधिकारिक ईमेल' : 'Official Email'}
                    </strong>
                    <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
                      foundationgsdd@gmail.com
                    </span>
                  </div>
                </div>

                <div className="contact-item">
                  <div className="contact-icon-circle">
                    <IconClock size={20} color="#fbbf24" />
                  </div>
                  <div>
                    <strong style={{ display: 'block', fontSize: '0.9rem', color: '#f8fafc' }}>
                      {isHi ? 'कार्यालय समय' : 'Office Hours'}
                    </strong>
                    <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
                      {isHi ? 'सोमवार – शनिवार: प्रातः 9:30 से शाम 6:00 तक' : 'Monday – Saturday: 9:30 AM to 6:00 PM'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Form Panel */}
            <div className="contact-form-panel">
              <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', marginBottom: '8px' }}>
                {isHi ? 'सहयोग या पूछताछ हेतु संदेश भेजें' : 'Initiate a Collaboration or Inquiry'}
              </h3>
              <p style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: '24px' }}>
                {isHi ? 'नीचे विवरण भरें, हमारी टीम शीघ्र आपसे संपर्क करेगी।' : 'Fill out the details below and our team will get back to you promptly.'}
              </p>

              {formSubmitted ? (
                <div style={{ background: '#dcfce7', border: '1px solid #86efac', padding: '20px', borderRadius: '10px', color: '#166534', textAlign: 'center' }}>
                  <h4 style={{ fontWeight: 700, marginBottom: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    <IconCheckVerified size={20} color="#166534" /> {isHi ? 'धन्यवाद!' : 'Thank You!'}
                  </h4>
                  <p style={{ fontSize: '0.9rem' }}>
                    {isHi ? 'आपका संदेश प्राप्त हो गया है। GSDD प्रतिनिधि शीघ्र आपसे संपर्क करेंगे।' : 'Your message has been received. GSDD Foundation representative will contact you shortly.'}
                  </p>
                </div>
              ) : (
                <form onSubmit={handleFormSubmit}>
                  <div className="form-group">
                    <label>{isHi ? 'पूरा नाम *' : 'Full Name *'}</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder={isHi ? 'उदा. रमेश कुमार' : 'e.g. Ramesh Kumar'}
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div className="form-group">
                      <label>{isHi ? 'मोबाइल नंबर *' : 'Mobile Number *'}</label>
                      <input
                        type="tel"
                        className="form-control"
                        placeholder="+91 98765 43210"
                        required
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label>{isHi ? 'ईमेल पता' : 'Email Address'}</label>
                      <input
                        type="email"
                        className="form-control"
                        placeholder="yourname@gmail.com"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>{isHi ? 'रुचि का क्षेत्र / विषय' : 'Initiative of Interest / Subject'}</label>
                    <select
                      className="form-control"
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    >
                      <option value="Skill Development & Digital Literacy">
                        {isHi ? 'कौशल विकास एवं डिजिटल साक्षरता' : 'Skill Development & Digital Literacy'}
                      </option>
                      <option value="Healthcare Awareness Camps">
                        {isHi ? 'स्वास्थ्य जागरूकता शिविर' : 'Healthcare Awareness Camps'}
                      </option>
                      <option value="Women Empowerment & SHG">
                        {isHi ? 'महिला सशक्तिकरण एवं स्वावलंबन' : 'Women Empowerment & SHG'}
                      </option>
                      <option value="CSR Partnership / NGO Collaboration">
                        {isHi ? 'CSR साझेदारी / NGO सहयोग' : 'CSR Partnership / NGO Collaboration'}
                      </option>
                      <option value="Volunteer / Youth Engagement">
                        {isHi ? 'स्वयंसेवा / युवा सहभागिता' : 'Volunteer / Youth Engagement'}
                      </option>
                      <option value="General Inquiry / Other">
                        {isHi ? 'सामान्य पूछताछ / अन्य' : 'General Inquiry / Other'}
                      </option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>{isHi ? 'संदेश / विवरण *' : 'Message / Details *'}</label>
                    <textarea
                      rows={4}
                      className="form-control"
                      placeholder={isHi ? 'आप किस प्रकार सहयोग करना चाहते हैं या क्या जानकारी चाहते हैं?' : 'How would you like to collaborate or what information do you require?'}
                      required
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    ></textarea>
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary"
                    style={{ width: '100%', padding: '14px', fontSize: '1rem' }}
                  >
                    {isHi ? 'संदेश भेजें' : 'Submit Message'}
                    <IconArrowRight size={16} />
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Footer with Real Brand Vector Icons */}
      <footer className="site-footer">
        <div className="container">
          <div className="footer-grid">
            <div className="footer-col">
              <div className="logo-wrapper" style={{ marginBottom: '16px' }}>
                <img
                  src="/logo.png"
                  alt="GSDD Foundation"
                  style={{ height: '48px', width: 'auto', background: '#ffffff', padding: '4px', borderRadius: '6px' }}
                />
                <div className="logo-text">
                  <h2 style={{ color: '#ffffff', fontSize: '1.1rem' }}>GSDD FOUNDATION</h2>
                  <p style={{ color: '#94a3b8' }}>
                    {isHi ? 'ग्लोबल स्किल्स & डिजिटल डेवलपमेंट' : 'Global Skills & Digital Development'}
                  </p>
                </div>
              </div>
              <p style={{ fontSize: '0.86rem', color: '#94a3b8', lineHeight: 1.6 }}>
                {isHi
                  ? 'पंजीकृत सेक्शन 8 गैर-लाभकारी संस्था जो सामाजिक कल्याण, डिजिटल साक्षरता, व्यावसायिक कौशल और ग्रामीण विकास के लिए समर्पित है।'
                  : 'Registered Section 8 Non-Profit Organization committed to nationwide social welfare, digital literacy, vocational training, healthcare, and sustainable grassroots community growth.'}
              </p>

              {/* REAL SVG BRAND ICONS */}
              <div className="social-icons">
                <a href="https://www.facebook.com/gsddfoundation" target="_blank" rel="noopener noreferrer" className="social-btn facebook" title="Facebook">
                  <IconFacebook size={18} />
                </a>
                <a href="https://www.instagram.com/gsddfoundation" target="_blank" rel="noopener noreferrer" className="social-btn instagram" title="Instagram">
                  <IconInstagram size={18} />
                </a>
                <a href="https://www.youtube.com/@gsddfoundation" target="_blank" rel="noopener noreferrer" className="social-btn youtube" title="YouTube">
                  <IconYouTube size={18} />
                </a>
                <a href="https://www.linkedin.com/company/gsddfoundation/posts/?feedView=all" target="_blank" rel="noopener noreferrer" className="social-btn linkedin" title="LinkedIn">
                  <IconLinkedIn size={18} />
                </a>
                <a href="https://x.com/gsddfoundation" target="_blank" rel="noopener noreferrer" className="social-btn twitter" title="Twitter / X">
                  <IconXTwitter size={18} />
                </a>
                <a href="https://wa.me/919546752915" target="_blank" rel="noopener noreferrer" className="social-btn whatsapp" title="WhatsApp">
                  <IconWhatsApp size={18} />
                </a>
                <a href="https://whatsapp.com/channel/0029VbDI7zjElagzRp0vTp0t" target="_blank" rel="noopener noreferrer" className="social-btn whatsapp" title="WhatsApp Channel">
                  <IconWhatsApp size={18} />
                </a>
                <a href="https://web.telegram.org/gsddfoundation/" target="_blank" rel="noopener noreferrer" className="social-btn telegram" title="Telegram">
                  <IconTelegram size={18} />
                </a>
                <a href="https://www.snapchat.com/@gsddfoundation" target="_blank" rel="noopener noreferrer" className="social-btn snapchat" title="Snapchat">
                  <IconSnapchat size={18} />
                </a>
              </div>
            </div>

            <div className="footer-col">
              <h5>{isHi ? 'त्वरित लिंक' : 'Quick Links'}</h5>
              <ul className="footer-links">
                <li><a href="#about">{isHi ? 'फाउंडेशन परिचय' : 'About Our Foundation'}</a></li>
                <li><a href="#initiatives">{isHi ? '12 मुख्य कार्य क्षेत्र' : '12 Core Initiatives'}</a></li>
                <li><a href="#legal-vault">{isHi ? 'सरकारी साख एवं पंजीकरण' : 'Statutory Credentials'}</a></li>
                <li><a href="#leadership">{isHi ? 'संस्थापक एवं नेतृत्व' : 'Founders & Leadership'}</a></li>
                <li><a href="#contact">{isHi ? 'संपर्क एवं प्रधान कार्यालय' : 'Contact & Head Office'}</a></li>
              </ul>
            </div>

            <div className="footer-col">
              <h5>{isHi ? '12 कार्य क्षेत्र' : '12 Work Sectors'}</h5>
              <ul className="footer-links">
                <li><a href="#initiatives">{isHi ? 'स्वास्थ्य रक्षा एवं कल्याण' : 'Healthcare Awareness'}</a></li>
                <li><a href="#initiatives">{isHi ? 'शिक्षा एवं साक्षरता' : 'Education & Literacy'}</a></li>
                <li><a href="#initiatives">{isHi ? 'डिजिटल समावेशन' : 'Digital Empowerment'}</a></li>
                <li><a href="#initiatives">{isHi ? 'महिला स्वावलंबन' : 'Women Empowerment'}</a></li>
                <li><a href="#initiatives">{isHi ? 'ग्रामीण विकास' : 'Rural Development'}</a></li>
                <li><a href="#initiatives">{isHi ? 'सरकारी योजना लाभ' : 'Govt Schemes Linkage'}</a></li>
              </ul>
            </div>

            <div className="footer-col">
              <h5>{isHi ? 'वैधानिक विवरण व पता' : 'Statutory Info & Office'}</h5>
              <p style={{ fontSize: '0.85rem', color: '#cbd5e1', marginBottom: '8px' }}>
                <strong>Reg No:</strong> U88900BR2026NPL086114
              </p>
              <p style={{ fontSize: '0.85rem', color: '#cbd5e1', marginBottom: '8px' }}>
                <strong>DARPAN:</strong> BR/2026/1140209
              </p>
              <p style={{ fontSize: '0.85rem', color: '#cbd5e1', marginBottom: '8px' }}>
                <strong>12A / 80G:</strong> Income Tax Dept Verified
              </p>
              <p style={{ fontSize: '0.85rem', color: '#94a3b8', marginTop: '12px', lineHeight: 1.5 }}>
                Raniganj NH 327e, Near Maa Ashawaar Mandir, Araria, Bihar, India
              </p>
            </div>
          </div>

          <div className="footer-bottom">
            <div>
              &copy; {new Date().getFullYear()} Global Skills & Digital Development Foundation (GSDD FOUNDATION). All Rights Reserved.
            </div>
            <div style={{ display: 'flex', gap: '20px' }}>
              <a href="#legal-vault">{isHi ? 'पारदर्शिता एवं अनुपालन' : 'Compliance & Transparency'}</a>
              <a href="#legal-vault">{isHi ? '80G कर छूट' : '80G Tax Exemption'}</a>
              <a href="#contact">{isHi ? 'गोपनीयता एवं नियम' : 'Privacy & Terms'}</a>
            </div>
          </div>
        </div>
      </footer>

      {/* Donation Modal with Vector Icons */}
      {donateModal && (
        <div className="modal-overlay" onClick={() => setDonateModal(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setDonateModal(false)}>
              &times;
            </button>
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <img
                src="/logo.png"
                alt="GSDD Foundation Logo"
                style={{ height: '56px', margin: '0 auto 10px', display: 'block' }}
              />
              <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a' }}>
                {isHi ? 'GSDD फाउंडेशन को सहयोग दें' : 'Support GSDD Foundation'}
              </h3>
              <p style={{ fontSize: '0.85rem', color: '#d97706', fontWeight: 600 }}>
                {isHi ? 'धारा 80G के अंतर्गत 50% आयकर छूट' : 'Eligible for 50% Tax Exemption under Section 80G'}
              </p>
            </div>

            <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '10px', border: '1px solid #e2e8f0', marginBottom: '20px', fontSize: '0.88rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ color: '#64748b' }}>Account Name:</span>
                <strong style={{ color: '#0f172a', fontSize: '0.8rem' }}>GLOBAL SKILLS & DIGITAL DEVELOPMENT FOUNDATION</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ color: '#64748b' }}>80G Certificate:</span>
                <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>AANCG1860EF20261</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ color: '#64748b' }}>12A Registration:</span>
                <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>AANCG1860EE20261</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Official Helpline:</span>
                <strong style={{ color: '#0f172a' }}>+91 9546752915</strong>
              </div>
            </div>

            <p style={{ fontSize: '0.85rem', color: '#64748b', textAlign: 'center', marginBottom: '20px' }}>
              {isHi
                ? 'आपका सहयोग सीधे तौर पर ग्रामीण व जरूरतमंद बच्चों की कंप्यूटर शिक्षा, स्वास्थ्य शिविरों और महिलाओं के स्वावलंबन में उपयोग किया जाता है।'
                : 'Your donation directly enables computer education, healthcare camps, and women self-help livelihood programs in rural and underserved areas.'}
            </p>

            <button
              onClick={() => {
                alert(isHi ? 'सहयोग के लिए धन्यवाद! हमारे अधिकृत समन्वयक 9546752915 पर 80G रसीद हेतु आपसे संपर्क करेंगे।' : 'Thank you for choosing to support! Our official coordinator will contact you at 9546752915 for statutory 80G donation receipt.');
                setDonateModal(false);
              }}
              className="btn btn-primary"
              style={{ width: '100%', padding: '14px' }}
            >
              <IconHeart size={16} /> {isHi ? 'दान हेतु कार्यालय से संपर्क करें' : 'Contact Official Desk to Donate'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
