import AdminBlog from './pages/AdminBlog';
import AdminEvents from './pages/AdminEvents';
import AdminLegal from './pages/AdminLegal';
import AdminVendorDetail from './pages/AdminVendorDetail';
import AdminVendors from './pages/AdminVendors';
import Blog from './pages/Blog';
import BlogPostDetail from './pages/BlogPostDetail';
import Bookings from './pages/Bookings';
import CategoryPage from './pages/CategoryPage';
import Classifieds from './pages/Classifieds';
import CompleteProfile from './pages/CompleteProfile';
import Conference from './pages/Conference';
import CookiePolicy from './pages/CookiePolicy';
import CreateEvent from './pages/CreateEvent';
import EditEvent from './pages/EditEvent';
import EditVendor from './pages/EditVendor';
import EventDetail from './pages/EventDetail';
import EventPlanning from './pages/EventPlanning';
import Funeral from './pages/Funeral';
import HelpCenter from './pages/HelpCenter';
import Home from './pages/Home';
import Join from './pages/Join';
import LegalPage from './pages/LegalPage';
import ManageListing from './pages/ManageListing';
import Messages from './pages/Messages';
import MyFavorites from './pages/MyFavorites';
import MyFeed from './pages/MyFeed';
import MyPicks from './pages/MyPicks';
import MyProfile from './pages/MyProfile';
import Notifications from './pages/Notifications';
import Parties from './pages/Parties';
import PrivacyPolicy from './pages/PrivacyPolicy';
import SocialCallback from './pages/SocialCallback';
import TestBackend from './pages/TestBackend';
import UserProfile from './pages/UserProfile';
import VendorDetail from './pages/VendorDetail';
import VendorMarketplace from './pages/VendorMarketplace';
import VendorSignup from './pages/VendorSignup';
import Weddings from './pages/Weddings';
import Settings from './pages/Settings';
import __Layout from './Layout.jsx';


export const PAGES = {
    "AdminBlog": AdminBlog,
    "AdminEvents": AdminEvents,
    "AdminLegal": AdminLegal,
    "AdminVendorDetail": AdminVendorDetail,
    "AdminVendors": AdminVendors,
    "Blog": Blog,
    "BlogPostDetail": BlogPostDetail,
    "Bookings": Bookings,
    "CategoryPage": CategoryPage,
    "Classifieds": Classifieds,
    "CompleteProfile": CompleteProfile,
    "Conference": Conference,
    "CookiePolicy": CookiePolicy,
    "CreateEvent": CreateEvent,
    "EditEvent": EditEvent,
    "EditVendor": EditVendor,
    "EventDetail": EventDetail,
    "EventPlanning": EventPlanning,
    "Funeral": Funeral,
    "HelpCenter": HelpCenter,
    "Home": Home,
    "Join": Join,
    "LegalPage": LegalPage,
    "ManageListing": ManageListing,
    "Messages": Messages,
    "MyFavorites": MyFavorites,
    "MyFeed": MyFeed,
    "MyPicks": MyPicks,
    "MyProfile": MyProfile,
    "Notifications": Notifications,
    "Parties": Parties,
    "PrivacyPolicy": PrivacyPolicy,
    "SocialCallback": SocialCallback,
    "TestBackend": TestBackend,
    "UserProfile": UserProfile,
    "VendorDetail": VendorDetail,
    "VendorMarketplace": VendorMarketplace,
    "VendorSignup": VendorSignup,
    "Weddings": Weddings,
    "Settings": Settings,
}

export const pagesConfig = {
    mainPage: "VendorMarketplace",
    Pages: PAGES,
    Layout: __Layout,
};