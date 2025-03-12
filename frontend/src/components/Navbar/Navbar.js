import { useEffect, useState } from "react";
import { Button, Dropdown } from "flowbite-react";
import { Link } from "react-router-dom";
import AuthModal from "../ComponentTools/AuthModal";
import { useAuthContext } from "../../Contexts/AuthContext";
import UserSettingsModal from "../ComponentTools/UserSettingsModal";
import { HiLogout } from "react-icons/hi";
import ControllerSettingModal from "../ControllerSettingModal/ControllerSettingModal";

const useHooks = () => {
  // 預設為當前的location
  const dafaultLocation = window.location.pathname;
  const { isAuth, authDetail, setIsAuth, setAuthDetail } = useAuthContext();
  const [location, setLocation] = useState(dafaultLocation);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [userPhoto, setUserPhoto] = useState("");
  const [isControllerSettingModalOpen, setIsControllerSettingModalOpen] = useState(false);

  // 開啟或關閉手機版選單
  const onMobileMenuClick = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  // 開啟AuthModal
  const onAuthModalClick = () => {
    setIsAuthModalOpen(!isAuthModalOpen);
  };

  // 點擊連結時，將location設為點擊的連結
  const onLinkClick = (href) => {
    setLocation(href);

    if (isMobileMenuOpen) {
      setIsMobileMenuOpen(false);
    }
  };

  // 登出按鈕的Click事件
  const onSignOutClick = () => {
    setIsAuth(false);
    localStorage.setItem("isAuth", false);
    setAuthDetail({});
    localStorage.removeItem("authDetail");
    localStorage.removeItem('refresh_token');
    window.location.reload();
  };

  // 關閉頭像設定視窗
  const onCloseSettingsModal = () => {
    setIsSettingsModalOpen(false);
  };

  // 點擊頭像時，開啟設定視窗
  const handleSettingsClick = () => {
    setIsSettingsModalOpen(true);
  };

  // 開啟或關閉ControllerSettingModal
  const onControllerSettingModalClick = () => {
    setIsControllerSettingModalOpen(!isControllerSettingModalOpen);
  };

  // 正常視窗的連結
  const LinkContainer = ({ href, title }) => (
    <Link
      className={`rounded-md px-3 py-2 text-sm font-medium text-white ${location === href ? 'bg-gray-900' : 'text-gray-300'} hover:bg-gray-800 hover:text-white`}
      to={href}
      onClick={() => onLinkClick(href)}
    >
      {title}
    </Link>
  );

  // 手機版的連結
  const LinkContainerForMobile = ({ href, title }) => (
    <Link
      className={`block rounded-md px-3 py-2 text-base font-medium text-white ${location === href ? 'bg-gray-900' : 'text-gray-300'} hover:bg-gray-800 hover:text-white`}
      to={href}
      onClick={() => onLinkClick(href)}
    >
      {title}
    </Link>
  );

  useEffect(() => {
    if (dafaultLocation === "/") {
      setLocation("/controllerPage");  
    }
  }, [dafaultLocation]);

  useEffect(() => {
    if (authDetail?.photo_path) {
      const path = authDetail.photo_path.split('\\\\').join('/');
      const pathArray = path.split('\\');
      const finalPath = pathArray.slice(2).join('/');
      setUserPhoto(finalPath);
    }
  }, [authDetail]);

  return {
    isMobileMenuOpen,
    isAuthModalOpen,
    isAuth,
    authDetail,
    isSettingsModalOpen,
    isControllerSettingModalOpen,
    userPhoto,
    LinkContainer,
    onMobileMenuClick,
    LinkContainerForMobile,
    onAuthModalClick,
    onSignOutClick,
    onCloseSettingsModal,
    handleSettingsClick,
    onControllerSettingModalClick
  };
};

const Navbar = () => {
  const { isMobileMenuOpen, isAuthModalOpen, isAuth, authDetail, isSettingsModalOpen, userPhoto, isControllerSettingModalOpen,
    LinkContainer, onMobileMenuClick, LinkContainerForMobile, onAuthModalClick, onSignOutClick, onCloseSettingsModal, handleSettingsClick,
    onControllerSettingModalClick
  } = useHooks();

  return (
    <nav className="bg-gray-700">
      <div className="mx-auto max-w-8xl px-2 sm:px-6 lg:px-8">
        {
          isAuthModalOpen && (
            <AuthModal
              isOpen={isAuthModalOpen}
              onClose={onAuthModalClick}
            />
          )
        }
        <UserSettingsModal
          isOpen={isSettingsModalOpen}
          onClose={onCloseSettingsModal}
          user={authDetail}
        />
        <div className="relative flex h-16 items-center justify-between">
          <div className="flex items-center">
            <div
              className="flex items-center md:hidden"
            >
              <Button
                className="relative inline-flex items-center justify-center rounded-md p-2 text-gray-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white bg-transparent"
                color="white"
                aria-controls="mobile-menu"
                aria-expanded="false"
                onClick={onMobileMenuClick}
              >
                <span className="absolute -inset-0.5"></span>
                <svg className={`h-6 w-6 ${isMobileMenuOpen ? 'hidden': 'block'}`} fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" aria-hidden="true" data-slot="icon">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                </svg>
                <svg className={`h-6 w-6 ${isMobileMenuOpen ? 'block': 'hidden'}`} fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" aria-hidden="true" data-slot="icon">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </Button>
            </div>
          </div>
          <div className="flex flex-1 items-center justify-center sm:items-stretch sm:justify-start">
            <div className="flex items-center hidden md:block">
              <img className="h-8 w-auto" src="./microchip-solid.svg" alt="LAPPJ control system" />
            </div>
            <div className="hidden md:block md:ml-6">
              <div className="flex space-x-4">
                <LinkContainer
                  href="/controllerPage"
                  title="控制頁面"
                />
                <LinkContainer
                  href="/portAutoConnectPage"
                  title="設備連線"
                />
                <LinkContainer
                  href="/mfcLaserSetting"
                  title="MFC及Laser設定"
                />
                <LinkContainer
                  href="/recipePage"
                  title="參數管理"
                />
                <LinkContainer
                  href="/transmittancePage"
                  title="穿透度量測"
                />
                <LinkContainer
                  href="/LabWeb"
                  title="Lab web"
                />
              </div>
            </div>
          </div>
          <div className="absolute inset-y-0 right-0 flex items-center pr-2 sm:static sm:inset-auto sm:ml-6 sm:pr-0">
            <div className="relative ml-3 flex items-center">
            {
              isAuth ? (
                <>
                  <div
                    className="mr-3 text-base font-medium text-white"
                  >
                    {authDetail?.username || "User"}
                  </div>
                  <button
                    className="rounded-full bg-gray-800 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-800 w-12 h-12 mr-3"
                    id="user-menu-button"
                    aria-expanded="false"
                    aria-haspopup="true"
                    onClick={handleSettingsClick}
                  >
                    {
                      authDetail?.photo_path ? (
                        <img
                          className="w-12 h-12 rounded-full"
                          src={userPhoto}
                          alt="User avatar"
                        />
                      ) : (
                        <svg className="h-8 w-8 rounded-full dark:text-white" fill="currentColor" viewBox="0 0 8 25">
                          <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                        </svg>
                      )
                    }
                  </button>
                  <Dropdown label="登出/設定" size="sm" color="purple">
                    <Dropdown.Item onClick={onControllerSettingModalClick}>自動控制設置</Dropdown.Item>
                    <Dropdown.Divider />
                    <Dropdown.Item onClick={onSignOutClick} icon={HiLogout}>Sign out</Dropdown.Item>
                  </Dropdown>
                </>
              ) : (
                <Button
                  id="user-menu-button"
                  aria-expanded="false"
                  aria-haspopup="true"
                  gradientMonochrome="info"
                  onClick={onAuthModalClick}
                >
                  Sign in
                </Button>
              )
            }
            </div>
          </div>
        </div>
      </div>
      <div className={`md:hidden ${isMobileMenuOpen ? 'block' : 'hidden'}`} id="mobile-menu">
        <div className="space-y-1 px-2 pb-3 pt-2">
        <LinkContainerForMobile
          href="/controllerPage"
          title="控制頁面"
        />
        <LinkContainerForMobile
          href="/portAutoConnectPage"
          title="設備連線"
        />
        <LinkContainerForMobile
          href="/mfcLaserSetting"
          title="MFC及Laser設定"
        />
        <LinkContainerForMobile
          href="/recipePage"
          title="參數管理"
        />
        <LinkContainerForMobile
          href="/transmittancePage"
          title="穿透度量測"
        />
        <LinkContainerForMobile
          href="/LabWeb"
          title="Lab web"
        />
        </div>
      </div>
      <ControllerSettingModal
        show={isControllerSettingModalOpen}
        onClose={onControllerSettingModalClick}
      />
    </nav>
  );
};

export default Navbar;