import './output.css';
import './expand.css';
import { Route, Routes } from 'react-router-dom';
import Navbar from './components/Navbar/Navbar';
import { AlicatProvider } from './Contexts/AlicatContext';
import { AuthProvider } from './Contexts/AuthContext';
import ControllerPage from './components/ControllerPage/ControllerPage';
import MfcLaserSetting from './components/MfcLaserSetting/MfcLaserSetting';
import ReproducibilityPage from './components/ReproducibilityPage/ReproducibilityPage';
import TransmittancePage from './components/TransmittancePage/TransmittancePage';
import RecipePage from './components/RecipePage/RecipePage';

const App = () => {
  return (
    <div className='App'>
      <AuthProvider>
        <AlicatProvider>
          <Navbar />
          <Routes>
              <Route index element={<ControllerPage />} />
              <Route path='/controllerPage' element={<ControllerPage />} />
              <Route path='/mfcLaserSetting' element={<MfcLaserSetting />} />
              <Route path='/transmittancePage' element={<TransmittancePage />} />
              <Route path='/reproducibilityPage' element={<ReproducibilityPage />} />
              <Route path='/recipePage' element={<RecipePage />} />
              {/* <Route path='*' element={<NoMatch />} /> */}
          </Routes>
        </AlicatProvider>
      </AuthProvider>
    </div>
  );
}

export default App;
