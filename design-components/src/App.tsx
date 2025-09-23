import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './App/src/Component/MainPage';
import Dashboard from './App/src/Component/Dashboard';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </Router>
  );
}

export default App;
