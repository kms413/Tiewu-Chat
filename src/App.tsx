import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { lazyLoad } from "./lib/lazyLoad";
import Redirect from "./containers/redirect";

const StartPage = lazyLoad(() => import("./containers/start"));
const ChatPage = lazyLoad(() => import("./containers/chat"));
const AboutPage = lazyLoad(()=>import("./containers/about"))

const basename = import.meta.env.BASE_URL.replace(/\/$/, "") || "/";

const router = createBrowserRouter([
    {
        path: "/",
        element: <Redirect />
    },
    {
        path: "/chat",
        element: <ChatPage />
    },
    {
        path: "/start",
        element: <StartPage />
    },
    {
        path: "about",
        element: <AboutPage />
    }
], {
    basename,
})

import("./containers/settings")


export default function App() {
    return <RouterProvider router={router} />;
}
