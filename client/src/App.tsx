import './App.css';
import { createBrowserRouter, RouterProvider } from 'react-router';
import { Toaster } from 'react-hot-toast';
import Authentication from './pages/Authentication';
import Dashboard from './pages/Dashboard';
import { authService } from './services/auth.service';

const router = createBrowserRouter([
	{
		path: '/',
		element: <Dashboard />,
		loader: () => authService.requireAuthLoader(),
	},
	{
		path: '/auth',
		element: <Authentication />,
		loader: () => authService.guestOnlyLoader(),
	},
	{
		path: '*',
		loader: () => authService.rootLoader(),
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
