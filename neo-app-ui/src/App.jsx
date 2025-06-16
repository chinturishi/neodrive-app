import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Register from "./Register";
import Login from "./Login";
import DirectoryView from "./DirectoryView";

const router = createBrowserRouter([
  // {
  //   path: "/*",
  //   element: <DirectoryViewAI />,
  // },
  {
    path: "/register",
    element: <Register />,
  },
  {
    path: "/drive",
    element: <DirectoryView />,
  },
  {
    path: "/",
    element: <Login />,
  },
]);
function App() {
  return <RouterProvider router={router} />;
}

export default App;
