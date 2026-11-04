import React, { useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import { useDispatch } from 'react-redux';
import { clearAuthSession } from '../utils/auth';
import PageLoader from '../components/common/PageLoader';

const Logout = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      clearAuthSession(dispatch, false);
      navigate('/login', { replace: true });
    }, 250);
    return () => clearTimeout(timer);
  }, [dispatch, navigate]);

  return (
    <PageLoader
      fullScreen={true}
      title="Logging out..."
      subtitle="Securely terminating your session"
    />
  );
};

export default Logout;
