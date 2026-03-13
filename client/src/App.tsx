import './App.css';
import { createBrowserRouter, redirect, RouterProvider } from 'react-router';
import Register from './pages/coursehub/Register';
import { Toaster } from 'react-hot-toast';
import Authentication from './pages/Authentication';

const router = createBrowserRouter([
	{
		path: '/',
		loader: () => redirect('/coursehub/login'),
	},
	{
		path: '/coursehub',
		children: [
			{
				path: 'register',
				element: <Register />,
			},
			{
				path: 'login',
				element: <Authentication />,
			},
		],
	},
]);

function App() {
	return (
		<>
			<Toaster />
			<RouterProvider router={router} />
		</>
	);
}

export default App;
