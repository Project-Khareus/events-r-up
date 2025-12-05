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
}

export const pagesConfig = {
    mainPage: "VendorMarketplace",
    Pages: PAGES,
    Layout: __Layout,
};