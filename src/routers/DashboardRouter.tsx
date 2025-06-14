import Sidebar from '@/elements/sidebar/Sidebar';
import DashboardHome from '@/pages/dashboard/DashboardHome';
import { useState } from 'react';
import { NavLink, Route, Routes } from 'react-router';
import CollapsedIcon from '@/assets/pterodactyl.svg';
import {
  BriefcaseIcon,
  CloudIcon,
  KeyIcon,
  MagnifyingGlassIcon,
  ServerStackIcon,
  UserIcon,
} from '@heroicons/react/24/outline';

export default function DashboardRouter() {
  const avatarURL = 'https://placehold.co/400x400/png';
  const [collapsed, setCollapsed] = useState(false);

  return (
    <>
      <div className="h-screen flex">
        <Sidebar collapsed={collapsed}>
          <div
            className="h-fit w-full flex flex-col items-center justify-center mt-1 select-none cursor-pointer"
            onClick={() => setCollapsed(!collapsed)}
          >
            <img src={CollapsedIcon} className="my-4 w-20" alt={'Pterodactyl Icon'} />
          </div>
          <Sidebar.Section>
            <a className="cursor-pointer">
              <MagnifyingGlassIcon />
              <span>Search</span>
            </a>
            <NavLink to={'/'} end>
              <ServerStackIcon />
              <span>Servers</span>
            </NavLink>
          </Sidebar.Section>
          <Sidebar.Section>
            <NavLink to={'/account'} end>
              <UserIcon />
              <span>Account</span>
            </NavLink>
            <NavLink to={'/account/api'} end>
              <CloudIcon />
              <span>API Credentials</span>
            </NavLink>
            <NavLink to={'/account/ssh'} end>
              <KeyIcon />
              <span>SSH Keys</span>
            </NavLink>
            <NavLink to={'/account/ssh'} end>
              <BriefcaseIcon />
              <span>Activity</span>
            </NavLink>
          </Sidebar.Section>
          <Sidebar.User>
            {avatarURL && (
              <img src={`${avatarURL}?s=64`} alt="Profile Picture" className="h-10 w-10 rounded-full select-none" />
            )}
            <div className="flex flex-col ml-3">
              <span className="font-sans font-normal text-sm text-neutral-50 whitespace-nowrap leading-tight select-none">
                Jelco
              </span>
              <span className="font-header font-normal text-xs text-neutral-300 whitespace-nowrap leading-tight select-none">
                Admin
              </span>
            </div>
          </Sidebar.User>
        </Sidebar>
        <Routes>
          <Route path="" element={<DashboardHome />} />
        </Routes>
      </div>
    </>
  );
}
