import './output.css';
import './expand.css';
import { Route, Routes } from 'react-router-dom';
import Navbar from './components/Navbar/Navbar';
import ControllerPage from './components/ControllerPage/ControllerPage';
import MfcLaserSetting from './components/MfcLaserSetting/MfcLaserSetting';
import ReproducibilityPage from './components/ReproducibilityPage/ReproducibilityPage';
import TransmittancePage from './components/TransmittancePage/TransmittancePage';

const App = () => {
  return (
    <div className='App'>
      <Navbar />
      <Routes>
          <Route index element={<ControllerPage />} />
          <Route path='/controllerPage' element={<ControllerPage />} />
          <Route path='/mfcLaserSetting' element={<MfcLaserSetting />} />
          <Route path='/transmittancePage' element={<TransmittancePage />} />
          <Route path='/reproducibilityPage' element={<ReproducibilityPage />} />
          {/* <Route path='*' element={<NoMatch />} /> */}
      </Routes>
    </div>
  );
}

export default App;
