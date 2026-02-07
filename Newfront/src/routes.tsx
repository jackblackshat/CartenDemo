import { createBrowserRouter } from "react-router";
import Root from "./components/Root.tsx";
import MapHome from "./components/MapHome.tsx";
import SearchResults from "./components/SearchResults.tsx";
import SpotDetail from "./components/SpotDetail.tsx";
import Navigation from "./components/Navigation.tsx";
import Activity from "./components/Activity.tsx";
import Profile from "./components/Profile.tsx";
import GaragePaid from "./components/GaragePaid.tsx";
import HeatmapView from "./components/HeatmapView.tsx";
import EmptyState from "./components/EmptyState.tsx";
import NotificationSettings from "./components/NotificationSettings.tsx";
import MoreSettings from "./components/MoreSettings.tsx";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Root,
    children: [
      { 
        index: true, 
        Component: MapHome
      },
      { 
        path: "search", 
        Component: SearchResults
      },
      { 
        path: "spot/:id", 
        Component: SpotDetail
      },
      { 
        path: "navigate", 
        Component: Navigation
      },
      { 
        path: "activity", 
        Component: Activity
      },
      { 
        path: "profile", 
        Component: Profile
      },
      { 
        path: "garage/:id", 
        Component: GaragePaid
      },
      { 
        path: "heatmap", 
        Component: HeatmapView
      },
      { 
        path: "empty", 
        Component: EmptyState
      },
      { 
        path: "notifications", 
        Component: NotificationSettings
      },
      { 
        path: "more-settings", 
        Component: MoreSettings
      },
    ],
  },
]);