import VendorMarketplace from './pages/VendorMarketplace';
import VendorDetail from './pages/VendorDetail';
import Messages from './pages/Messages';
import Bookings from './pages/Bookings';
import EventPlanning from './pages/EventPlanning';
import VendorSignup from './pages/VendorSignup';
import MyPicks from './pages/MyPicks';
import Notifications from './pages/Notifications';
import CategoryPage from './pages/CategoryPage';
import LegalPage from './pages/LegalPage';
import Join from './pages/Join';
import Blog from './pages/Blog';
import BlogPostDetail from './pages/BlogPostDetail';
import AdminBlog from './pages/AdminBlog';
import CreateEvent from './pages/CreateEvent';
import Classifieds from './pages/Classifieds';
import EventDetail from './pages/EventDetail';
import UserProfile from './pages/UserProfile';
import MyFeed from './pages/MyFeed';
import TestBackend from './pages/TestBackend';
import ManageListing from './pages/ManageListing';
import AdminVendors from './pages/AdminVendors';
import Home from './pages/Home';
import Weddings from './pages/Weddings';
import Parties from './pages/Parties';
import Conference from './pages/Conference';
import Funeral from './pages/Funeral';
import CompleteProfile from './pages/CompleteProfile';
import MyFavorites from './pages/MyFavorites';
import AdminEvents from './pages/AdminEvents';
import SocialCallback from './pages/SocialCallback';
import AdminLegal from './pages/AdminLegal';
import MyProfile from './pages/MyProfile';
import __Layout from './Layout.jsx';


export const PAGES = {
    "VendorMarketplace": VendorMarketplace,
    "VendorDetail": VendorDetail,
    "Messages": Messages,
    "Bookings": Bookings,
    "EventPlanning": EventPlanning,
    "VendorSignup": VendorSignup,
    "MyPicks": MyPicks,
    "Notifications": Notifications,
    "CategoryPage": CategoryPage,
    "LegalPage": LegalPage,
    "Join": Join,
    "Blog": Blog,
    "BlogPostDetail": BlogPostDetail,
    "AdminBlog": AdminBlog,
    "CreateEvent": CreateEvent,
    "Classifieds": Classifieds,
    "EventDetail": EventDetail,
    "UserProfile": UserProfile,
    "MyFeed": MyFeed,
    "TestBackend": TestBackend,
    "ManageListing": ManageListing,
    "AdminVendors": AdminVendors,
    "Home": Home,
    "Weddings": Weddings,
    "Parties": Parties,
    "Conference": Conference,
    "Funeral": Funeral,
    "CompleteProfile": CompleteProfile,
    "MyFavorites": MyFavorites,
    "AdminEvents": AdminEvents,
    "SocialCallback": SocialCallback,
    "AdminLegal": AdminLegal,
    "MyProfile": MyProfile,
}

export const pagesConfig = {
    mainPage: "VendorMarketplace",
    Pages: PAGES,
    Layout: __Layout,
};