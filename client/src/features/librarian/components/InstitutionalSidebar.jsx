import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Landmark,
  Library,
  Layers,
  ScanBarcode,
  Repeat,
  BookmarkCheck,
  UserCheck,
  Scale,
  Scroll,
  Sparkles,
  Compass,
  BarChart3,
  ClipboardCheck,
  ShoppingCart,
  Bell,
  ShieldCheck,
  Sliders,
  ScrollText,
  Activity,
  PanelLeftClose,
  PanelLeftOpen,
  LogOut,
  ChevronDown,
  Shield,
  CircleDot
} from "lucide-react";
import { NepalGovEmblem } from "../../../components/NepalGovEmblem";
import "../styles/InstitutionalSidebar.css";

/**
 * Official Navigation Taxonomy adhering to Nepal Government (.gov.np)
 * Kaiser Library (klib.gov.np) Standards and MoEST Design Framework
 */
const NAVIGATION_GROUPS = [
  {
    group: "Overview",
    groupNe: "शासन तथा ड्यासबोर्ड",
    accent: "gold",
    items: [
      {
        to: "/librarian-dashboard",
        label: "Dashboard",
        labelNe: "केन्द्रीय ड्यासबोर्ड",
        badgeNe: "केन्द्रीय",
        icon: Landmark,
        description: "केन्द्रीय व्यवस्थापन तथा मुख्य प्रशासनिक ड्यासबोर्ड"
      }
    ]
  },
  {
    group: "Library Services",
    groupNe: "ग्रन्थालय सेवा तथा भण्डार",
    accent: "blue",
    items: [
      {
        to: "/librarian/update-stock",
        label: "Book Catalog & Copies",
        labelNe: "ग्रन्थ सूची तथा मौज्दात",
        icon: Library,
        description: "केन्द्रीय ग्रन्थ सूची, प्रतिलिपि तथा वर्गीकरण"
      },
      {
        to: "/librarian/shelf-map",
        label: "Shelf & Rack Navigator",
        labelNe: "दराज तथा र्याक नक्सा",
        icon: Layers,
        description: "भौतिक र्याक, कोठा तथा दराज लेआउट"
      },
      {
        to: "/librarian/rfid-audit",
        label: "Barcode & RFID Desk",
        labelNe: "बारकोड तथा आरएफआईडी",
        icon: ScanBarcode,
        description: "डिजिटल पहिचान, ट्याग स्क्यानिङ तथा अडिट"
      },
      {
        to: "/librarian/issue-book?tab=issue",
        label: "Circulation (Issue/Return)",
        labelNe: "सर्कुलेसन (जारी / फिर्ता)",
        icon: Repeat,
        description: "ग्रन्थ वितरण, फिर्ता तथा नवीकरण डेस्क"
      },
      {
        to: "/librarian/reservations",
        label: "Smart Reservations",
        labelNe: "अग्रिम आरक्षण सूची",
        icon: BookmarkCheck,
        description: "पाठकहरूको अग्रिम ग्रन्थ आरक्षण व्यवस्थापन"
      },
      {
        to: "/librarian/members",
        label: "Students & Members",
        labelNe: "पाठक तथा सदस्य पञ्जीकरण",
        icon: UserCheck,
        description: "सदस्यता दर्ता, परिचयपत्र तथा कार्ड"
      },
      {
        to: "/librarian/fines",
        label: "Fines & Revenue Ledger",
        labelNe: "शुल्क तथा जरिवाना अभिलेख",
        icon: Scale,
        description: "विलम्ब शुल्क, राजस्व रसिद तथा भुक्तानी"
      },
      {
        to: "/student-dashboard/digital-library",
        label: "Digital Manuscripts",
        labelNe: "ई-पुस्तकालय तथा पाण्डुलिपि",
        badgeNe: "अभिलेख",
        icon: Scroll,
        description: "दुर्लभ ऐतिहासिक पाण्डुलिपि तथा डिजिटल ग्रन्थ"
      }
    ]
  },
  {
    group: "Intelligence",
    groupNe: "सूचना प्रविधि तथा विश्लेषण",
    accent: "purple",
    items: [
      {
        to: "/librarian/ai-assistant",
        label: "AI Library Assistant",
        labelNe: "एआई ग्रन्थ सहायक",
        badgeNe: "AI",
        icon: Sparkles,
        description: "प्राकृतिक भाषा तथा बौद्धिक खोज सहायक"
      },
      {
        to: "/librarian/recommendations",
        label: "Smart Recommendations",
        labelNe: "ग्रन्थ सिफारिश प्रणाली",
        icon: Compass,
        description: "पाठक रुचि अनुसार बौद्धिक ग्रन्थ सिफारिश"
      },
      {
        to: "/librarian/analytics",
        label: "Analytics & Reports",
        labelNe: "तथ्याङ्क तथा प्रतिवेदन",
        icon: BarChart3,
        description: "सर्कुलेसन विश्लेषण तथा वार्षिक सरकारी प्रतिवेदन"
      }
    ]
  },
  {
    group: "Operations",
    groupNe: "सञ्चालन तथा सार्वजनिक खरिद",
    accent: "green",
    items: [
      {
        to: "/librarian/inventory-audit",
        label: "Stock Audits & Checks",
        labelNe: "मौज्दात परीक्षण (अडिट)",
        icon: ClipboardCheck,
        description: "भौतिक मौज्दात तथा बारकोड प्रमाणीकरण"
      },
      {
        to: "/librarian/procurement",
        label: "Procurement & Budgets",
        labelNe: "सार्वजनिक खरिद तथा बजेट",
        icon: ShoppingCart,
        description: "सार्वजनिक खरिद ऐन अनुसार बजेट तथा खरिद"
      },
      {
        to: "/librarian/jobs",
        label: "System Jobs & Circulars",
        labelNe: "कार्य तथा सूचना प्रणाली",
        icon: Bell,
        description: "स्वचालित म्याद सूचना तथा ब्याकग्राउन्ड कार्य"
      }
    ]
  },
  {
    group: "Administration",
    groupNe: "प्रशासन तथा नीतिगत नियन्त्रण",
    accent: "crimson",
    items: [
      {
        to: "/librarian/roles",
        label: "Access Control & Roles",
        labelNe: "अधिकार तथा प्रयोगकर्ता",
        icon: ShieldCheck,
        description: "सुरक्षा तह तथा कर्मचारी अधिकार व्यवस्थापन"
      },
      {
        to: "/librarian/settings",
        label: "Policies & Directives",
        labelNe: "पुस्तकालय नीति तथा सेटिङ",
        icon: Sliders,
        description: "ऋण सीमा, कार्यविधि तथा नियमावली"
      },
      {
        to: "/librarian/audit-logs",
        label: "Mahalekha Audit Logs",
        labelNe: "लेखापरीक्षण लग (Audit)",
        icon: ScrollText,
        description: "अपरिवर्तनीय प्रशासनिक गतिविधि लग"
      },
      {
        to: "/librarian/system-health",
        label: "Telemetry & Server Health",
        labelNe: "प्रणाली तथा सर्भर स्वास्थ्य",
        icon: Activity,
        description: "सर्भर कार्यसम्पादन, डेटाबेस र एपीआई स्वास्थ्य"
      }
    ]
  }
];

const InstitutionalSidebar = ({
  user,
  onLogout,
  collapsed,
  onToggleCollapse,
  mobileOpen,
  onCloseMobile
}) => {
  const location = useLocation();
  const [hoveredItem, setHoveredItem] = useState(null);

  const isActive = (path) => {
    const basePath = path.split("?")[0];
    return location.pathname === basePath;
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && <div className="sidebar-mobile-backdrop" onClick={onCloseMobile} />}

      <aside
        className={`institutional-sidebar ${collapsed ? "collapsed" : ""} ${mobileOpen ? "mobile-open" : ""}`}
        aria-label="Official Kaiser Library Navigation"
      >
        {/* Official .gov.np Brand Header with National Emblem */}
        <div className="sidebar-brand-header">
          <Link
            to="/librarian-dashboard"
            className="brand-emblem-wrapper"
            title="नेपाल सरकार · केशर पुस्तकालय (Kaiser Library)"
          >
            <div className="brand-emblem-aura">
              <NepalGovEmblem width={38} height={38} className="gov-emblem-svg" />
            </div>
          </Link>

          {!collapsed && (
            <div className="brand-text-block">
              <div className="gov-sub-hierarchy">
                <span className="gov-sub-line-top">नेपाल सरकार</span>
                <span className="gov-sub-line-dept">शिक्षा मन्त्रालय</span>
              </div>
              <h2 className="gov-brand-title">केशर पुस्तकालय</h2>
              <div className="gov-domain-badge">
                <span className="gov-domain-dot" />
                <span className="gov-domain-text">klib.gov.np</span>
              </div>
            </div>
          )}

          <button
            type="button"
            className="sidebar-toggle-btn"
            onClick={onToggleCollapse}
            title={collapsed ? "साइडबार खोल्नुहोस् (Expand sidebar)" : "साइडबार खुम्च्याउनुहोस् (Collapse sidebar)"}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
          </button>
        </div>

        {/* Heritage Campus Node Indicator */}
        {!collapsed && (
          <div className="gov-workspace-selector">
            <div className="workspace-badge-strip">
              <span className="workspace-label-np">केन्द्रीय निकाय</span>
              <span className="workspace-label-en">HERITAGE CAMPUS</span>
            </div>
            <div className="workspace-box">
              <div className="workspace-node-status">
                <span className="pulse-beacon" />
              </div>
              <div className="workspace-node-details">
                <span className="workspace-name-np">केशर महल, कान्तिपथ, काठमाडौं</span>
                <span className="workspace-sub-en">Kaiser Mahal Central Node · Active</span>
              </div>
              <ChevronDown size={14} className="workspace-chevron" />
            </div>
          </div>
        )}

        {/* Grouped Navigation Links */}
        <nav className="sidebar-nav-container" aria-label="Library Navigation Menu">
          {NAVIGATION_GROUPS.map((sec) => (
            <div key={sec.group} className={`nav-group-section accent-${sec.accent}`}>
              {!collapsed && (
                <div className="nav-group-heading-box">
                  <span className="nav-group-heading-ne">{sec.groupNe}</span>
                  <span className="nav-group-heading-en">{sec.group}</span>
                </div>
              )}

              <div className="nav-items-list" role="list">
                {sec.items.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.to);

                  return (
                    <div
                      key={item.to}
                      className="nav-item-wrapper"
                      onMouseEnter={() => setHoveredItem(item.to)}
                      onMouseLeave={() => setHoveredItem(null)}
                    >
                      <Link
                        to={item.to}
                        className={`nav-item-link ${active ? "active" : ""} accent-${sec.accent}`}
                        onClick={() => mobileOpen && onCloseMobile()}
                        aria-current={active ? "page" : undefined}
                      >
                        {/* Gov Icon Badge */}
                        <div className={`gov-icon-badge badge-${sec.accent}`}>
                          <Icon size={18} strokeWidth={2} />
                        </div>

                        {!collapsed && (
                          <div className="nav-item-text">
                            <div className="nav-item-title-row">
                              <span className="nav-item-label-ne">{item.labelNe}</span>
                              {item.badgeNe && (
                                <span className={`nav-item-tag tag-${sec.accent}`}>{item.badgeNe}</span>
                              )}
                            </div>
                            <span className="nav-item-label-en">{item.label}</span>
                          </div>
                        )}

                        {active && <span className="active-golden-pill" aria-hidden="true" />}
                      </Link>

                      {/* Tooltip for Collapsed State */}
                      {collapsed && hoveredItem === item.to && (
                        <div className="gov-collapsed-tooltip" role="tooltip">
                          <div className="tooltip-header">
                            <span className="tooltip-cat">{sec.groupNe}</span>
                            {item.badgeNe && (
                              <span className={`nav-item-tag tag-${sec.accent}`}>{item.badgeNe}</span>
                            )}
                          </div>
                          <span className="tooltip-title-ne">{item.labelNe}</span>
                          <span className="tooltip-title-en">{item.label}</span>
                          <span className="tooltip-desc">{item.description}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* User Profile & Official Clearance Footer */}
        <div className="sidebar-user-footer">
          <div className="user-official-avatar" title="अधिकृत कर्मचारी">
            <span className="avatar-initial">
              {(user?.username || user?.email || "L").charAt(0).toUpperCase()}
            </span>
            <span className="avatar-badge-dot" />
          </div>

          {!collapsed && (
            <div className="user-profile-info">
              <div className="user-profile-top-line">
                <span className="user-profile-name">{user?.username || "पुस्तकालय अधिकृत"}</span>
                <span className="user-gov-tag">अधिकृत</span>
              </div>
              <div className="user-profile-designation">
                <span className="designation-text">
                  {user?.role ? `${user.role.toUpperCase()} · Gazetted` : "पुस्तकालय प्रशासन"}
                </span>
              </div>
            </div>
          )}

          <button
            type="button"
            className="btn-sidebar-logout"
            onClick={onLogout}
            title="प्रणालीबाट सुरक्षित बाहिरिनुहोस् (Sign Out of klib.gov.np)"
            aria-label="Sign out"
          >
            <LogOut size={16} />
          </button>
        </div>
      </aside>
    </>
  );
};

export default InstitutionalSidebar;
