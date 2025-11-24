import VendorMarketplace from './pages/VendorMarketplace';
import VendorDetail from './pages/VendorDetail';
import Messages from './pages/Messages';
import Bookings from './pages/Bookings';
import EventPlanning from './pages/EventPlanning';


export const PAGES = {
    "VendorMarketplace": VendorMarketplace,
    "VendorDetail": VendorDetail,
    "Messages": Messages,
    "Bookings": Bookings,
    "EventPlanning": EventPlanning,
}

export const pagesConfig = {
    mainPage: "VendorMarketplace",
    Pages: PAGES,
};