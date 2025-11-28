import VendorMarketplace from './pages/VendorMarketplace';
import VendorDetail from './pages/VendorDetail';
import Messages from './pages/Messages';
import Bookings from './pages/Bookings';
import EventPlanning from './pages/EventPlanning';
import VendorSignup from './pages/VendorSignup';
import MyPicks from './pages/MyPicks';
import Notifications from './pages/Notifications';
import CategoryPage from './pages/CategoryPage';
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
}

export const pagesConfig = {
    mainPage: "VendorMarketplace",
    Pages: PAGES,
    Layout: __Layout,
};