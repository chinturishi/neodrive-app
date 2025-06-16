import { createBrowserRouter, RouterProvider } from "react-router-dom";
import DirectoryView from "./DirectoryView";
import DirectoryViewAI from "./DirectoryViewAI";
import Register from "./Register";
import Login from "./Login";

const router = createBrowserRouter([
  {
    path: "/*",
    element: <DirectoryViewAI />,
  },
  {
    path: "/register",
    element: <Register />,
  },
  {
    path: "/login",
    element: <Login />,
  },
]);
function App() {
  return <RouterProvider router={router} />;
}

export default App;
