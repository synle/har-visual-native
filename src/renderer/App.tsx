import { MemoryRouter as Router, Routes, Route } from 'react-router-dom';
import 'renderer/App.scss';

const Hello = () => {
  return (
    <div>
      <h1>electron-react-typescript-boilerplate</h1>
    </div>
  );
};

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Hello />} />
      </Routes>
    </Router>
  );
}
