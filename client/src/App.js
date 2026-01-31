import './App.css';
import {BrowserRouter as Router, Route, Routes} from 'react-router-dom';//Routes replaced Switch
import Home from "./pages/HomePage";
import AboutUs from "./pages/AboutUsPage";
import Whiteboard from "./pages/WhiteboardPage";
import './css/appstyle.css';

function App() {
  return (
    <Router>
      <Routes>
        {/*exact no longer needed as this is default
            element replaced component  */}
        <Route path="/" element={<Home />}/>
        <Route path="/About-Us" element={<AboutUs />}/>
        <Route path="/Whiteboard" element={<Whiteboard />}/>
      </Routes>
    </Router>
  );
}

export default App;
