import { useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import { useDispatch } from 'react-redux';
import { clearAuthSession } from '../utils/auth';

const Logout = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    clearAuthSession(dispatch, false);
    navigate('/login', { replace: true });
  }, [dispatch, navigate]);

  return null;
};

export default Logout;