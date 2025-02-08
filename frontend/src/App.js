import './output.css';
import './expand.css';
import { Route, Routes } from 'react-router-dom';
import Navbar from './components/Navbar/Navbar';
import { AlicatProvider } from './Contexts/AlicatContext';
import { AuthProvider } from './Contexts/AuthContext';
import { Co2LaserProvider } from './Contexts/Co2LaserContext';
import { HeaterProvider } from './Contexts/HeaterContext';
import ControllerPage from './components/ControllerPage/ControllerPage';
import MfcLaserSetting from './components/MfcLaserSetting/MfcLaserSetting';
import LabWeb from './components/LabWeb/LabWeb';
import TransmittancePage from './components/TransmittancePage/TransmittancePage';
import RecipePage from './components/RecipePage/RecipePage';
import PortAutoConnectPage from './components/PortAutoConnectPage/PortAutoConnectPage';

const App = () => {
  return (
    <div className='App'>
      <AuthProvider>
        <AlicatProvider>
          <Co2LaserProvider>
              <HeaterProvider>
            <Navbar />
            <Routes>
                <Route index element={<ControllerPage />} />
                <Route path='/controllerPage' element={<ControllerPage />} />
                <Route path='/mfcLaserSetting' element={<MfcLaserSetting />} />
                <Route path='/transmittancePage' element={<TransmittancePage />} />
                <Route path='/LabWeb' element={<LabWeb />} />
                <Route path='/recipePage' element={<RecipePage />} />
                <Route path='/portAutoConnectPage' element={<PortAutoConnectPage />} />
                {/* <Route path='*' element={<NoMatch />} /> */}
            </Routes>
              </HeaterProvider>
          </Co2LaserProvider>
        </AlicatProvider>
      </AuthProvider>
    </div>
  );
}

export default App;
