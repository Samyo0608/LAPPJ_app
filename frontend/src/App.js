import './output.css';
import './expand.css';
import { Route, Routes } from 'react-router-dom';
import Navbar from './components/Navbar/Navbar';
import { AlicatProvider } from './Contexts/AlicatContext';
import { AuthProvider } from './Contexts/AuthContext';
import { Co2LaserProvider } from './Contexts/Co2LaserContext';
import { HeaterProvider } from './Contexts/HeaterContext';
import { UltrasonicProvider } from './Contexts/UltrasonicContext';
import { AzbilProvider } from './Contexts/AzbilContext';
import { PowerSupplyProvider } from './Contexts/PowerSupplyContext';
import { SocketProvider } from './Contexts/SocketioContext';
import ControllerPage from './components/ControllerPage/ControllerPage';
import MfcLaserSetting from './components/MfcLaserSetting/MfcLaserSetting';
import LabWeb from './components/LabWeb/LabWeb';
import TransmittancePage from './components/TransmittancePage/TransmittancePage';
import RecipePage from './components/RecipePage/RecipePage';
import PortAutoConnectPage from './components/PortAutoConnectPage/PortAutoConnectPage';
import MrRemotePage from './components/MrRemotePage/MrRemotePage';

const App = () => {
  return (
    <div className='App'>
      <SocketProvider>
        <AuthProvider>
          <AlicatProvider>
            <AzbilProvider>
              <Co2LaserProvider>
                  <HeaterProvider>
                    <UltrasonicProvider>
                      <PowerSupplyProvider>
                        <Navbar />
                        <Routes>
                            <Route index element={<ControllerPage />} />
                            <Route path='/controllerPage' element={<ControllerPage />} />
                            <Route path='/mfcLaserSetting' element={<MfcLaserSetting />} />
                            <Route path='/transmittancePage' element={<TransmittancePage />} />
                            <Route path='/LabWeb' element={<LabWeb />} />
                            <Route path='/recipePage' element={<RecipePage />} />
                            <Route path='/portAutoConnectPage' element={<PortAutoConnectPage />} />
                            <Route path='/mrRemotePage' element={<MrRemotePage />} />
                            {/* <Route path='*' element={<NoMatch />} /> */}
                        </Routes>
                      </PowerSupplyProvider>
                    </UltrasonicProvider>
                  </HeaterProvider>
              </Co2LaserProvider>
            </AzbilProvider>
          </AlicatProvider>
        </AuthProvider>
      </SocketProvider>
    </div>
  );
}

export default App;
