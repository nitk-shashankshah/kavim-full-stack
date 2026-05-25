import React, { Fragment, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import Tab from "react-bootstrap/Tab";
import Nav from "react-bootstrap/Nav";
import SEO from "../../components/seo";
import LayoutOne from "../../layouts/LayoutOne";
import Breadcrumb from "../../wrappers/breadcrumb/Breadcrumb";
import { loginUser, registerUser, clearAuthError } from "../../store/slices/auth-slice";
import { syncCartFromAPI } from "../../store/slices/cart-slice";
import { syncWishlistFromAPI } from "../../store/slices/wishlist-slice";

const LoginRegister = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  let { pathname } = useLocation();

  const { loading, error } = useSelector((state) => state.auth);

  const [loginForm, setLoginForm] = useState({ username: "", password: "" });
  const [registerForm, setRegisterForm] = useState({ username: "", email: "", password: "" });

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    dispatch(clearAuthError());
    const result = await dispatch(loginUser(loginForm));
    if (loginUser.fulfilled.match(result)) {
      await dispatch(syncCartFromAPI());
      await dispatch(syncWishlistFromAPI());
      navigate(process.env.PUBLIC_URL + "/");
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    dispatch(clearAuthError());
    const result = await dispatch(registerUser(registerForm));
    if (registerUser.fulfilled.match(result)) {
      await dispatch(syncCartFromAPI());
      await dispatch(syncWishlistFromAPI());
      navigate(process.env.PUBLIC_URL + "/");
    }
  };

  return (
    <Fragment>
      <SEO
        titleTemplate="Login"
        description="Login page of flone react minimalist eCommerce template."
      />
      <LayoutOne headerTop="visible">
        <Breadcrumb
          pages={[
            { label: "Home", path: process.env.PUBLIC_URL + "/" },
            { label: "Login Register", path: process.env.PUBLIC_URL + pathname }
          ]}
        />
        <div className="login-register-area pt-100 pb-100">
          <div className="container">
            <div className="row">
              <div className="col-lg-7 col-md-12 ms-auto me-auto">
                <div className="login-register-wrapper">
                  <Tab.Container defaultActiveKey="login">
                    <Nav variant="pills" className="login-register-tab-list">
                      <Nav.Item>
                        <Nav.Link eventKey="login" onClick={() => dispatch(clearAuthError())}>
                          <h4>Login</h4>
                        </Nav.Link>
                      </Nav.Item>
                      <Nav.Item>
                        <Nav.Link eventKey="register" onClick={() => dispatch(clearAuthError())}>
                          <h4>Register</h4>
                        </Nav.Link>
                      </Nav.Item>
                    </Nav>
                    <Tab.Content>
                      <Tab.Pane eventKey="login">
                        <div className="login-form-container">
                          <div className="login-register-form">
                            <form onSubmit={handleLoginSubmit}>
                              <input
                                type="text"
                                name="username"
                                placeholder="Username"
                                value={loginForm.username}
                                onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
                                required
                              />
                              <input
                                type="password"
                                name="password"
                                placeholder="Password"
                                value={loginForm.password}
                                onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                                required
                              />
                              {error && <p style={{ color: "red", margin: "8px 0" }}>{error}</p>}
                              <div className="button-box">
                                <div className="login-toggle-btn">
                                  <input type="checkbox" />
                                  <label className="ml-10">Remember me</label>
                                  <Link to={process.env.PUBLIC_URL + "/"}>
                                    Forgot Password?
                                  </Link>
                                </div>
                                <button type="submit" disabled={loading}>
                                  <span>{loading ? "Logging in..." : "Login"}</span>
                                </button>
                              </div>
                            </form>
                          </div>
                        </div>
                      </Tab.Pane>
                      <Tab.Pane eventKey="register">
                        <div className="login-form-container">
                          <div className="login-register-form">
                            <form onSubmit={handleRegisterSubmit}>
                              <input
                                type="text"
                                name="username"
                                placeholder="Username"
                                value={registerForm.username}
                                onChange={(e) => setRegisterForm({ ...registerForm, username: e.target.value })}
                                required
                              />
                              <input
                                type="password"
                                name="password"
                                placeholder="Password"
                                value={registerForm.password}
                                onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                                required
                              />
                              <input
                                name="email"
                                placeholder="Email"
                                type="email"
                                value={registerForm.email}
                                onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                                required
                              />
                              {error && <p style={{ color: "red", margin: "8px 0" }}>{error}</p>}
                              <div className="button-box">
                                <button type="submit" disabled={loading}>
                                  <span>{loading ? "Registering..." : "Register"}</span>
                                </button>
                              </div>
                            </form>
                          </div>
                        </div>
                      </Tab.Pane>
                    </Tab.Content>
                  </Tab.Container>
                </div>
              </div>
            </div>
          </div>
        </div>
      </LayoutOne>
    </Fragment>
  );
};

export default LoginRegister;
