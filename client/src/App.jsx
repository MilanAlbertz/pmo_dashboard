import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Prospection from './pages/Prospection/Prospection';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Prospection />} />
      </Routes>
    </Router>
  );
}

export default App; 