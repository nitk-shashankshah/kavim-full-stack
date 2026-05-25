import { Fragment, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import cogoToast from "cogo-toast";
import { getDiscountPrice } from "../../helpers/product";
import SEO from "../../components/seo";
import LayoutOne from "../../layouts/LayoutOne";
import Breadcrumb from "../../wrappers/breadcrumb/Breadcrumb";
import { deleteAllFromCart } from "../../store/slices/cart-slice";
import { placeOrder } from "../../store/slices/order-slice";

const Checkout = () => {
  let cartTotalPrice = 0;

  const dispatch = useDispatch();
  const navigate = useNavigate();
  let { pathname } = useLocation();
  const currency = useSelector((state) => state.currency);
  const { cartItems } = useSelector((state) => state.cart);
  const { loading } = useSelector((state) => state.order);

  const [billing, setBilling] = useState({
    firstName: "",
    lastName: "",
    company: "",
    country: "",
    streetAddress: "",
    city: "",
    state: "",
    postcode: "",
    phone: "",
    email: "",
    orderNotes: "",
  });

  const handleChange = (e) => {
    setBilling({ ...billing, [e.target.name]: e.target.value });
  };

  const handlePlaceOrder = async () => {
    if (!billing.firstName || !billing.lastName || !billing.country || !billing.streetAddress || !billing.city || !billing.phone || !billing.email) {
      cogoToast.error("Please fill in all required billing fields", { position: "bottom-left" });
      return;
    }
    const result = await dispatch(placeOrder(billing));
    if (placeOrder.fulfilled.match(result)) {
      dispatch(deleteAllFromCart());
      cogoToast.success("Order placed successfully!", { position: "bottom-left" });
      navigate(process.env.PUBLIC_URL + "/");
    } else {
      cogoToast.error(result.payload || "Failed to place order", { position: "bottom-left" });
    }
  };

  return (
    <Fragment>
      <SEO
        titleTemplate="Checkout"
        description="Checkout page of flone react minimalist eCommerce template."
      />
      <LayoutOne headerTop="visible">
        <Breadcrumb
          pages={[
            { label: "Home", path: process.env.PUBLIC_URL + "/" },
            { label: "Checkout", path: process.env.PUBLIC_URL + pathname }
          ]}
        />
        <div className="checkout-area pt-95 pb-100">
          <div className="container">
            {cartItems && cartItems.length >= 1 ? (
              <div className="row">
                <div className="col-lg-7">
                  <div className="billing-info-wrap">
                    <h3>Billing Details</h3>
                    <div className="row">
                      <div className="col-lg-6 col-md-6">
                        <div className="billing-info mb-20">
                          <label>First Name <span>*</span></label>
                          <input type="text" name="firstName" value={billing.firstName} onChange={handleChange} />
                        </div>
                      </div>
                      <div className="col-lg-6 col-md-6">
                        <div className="billing-info mb-20">
                          <label>Last Name <span>*</span></label>
                          <input type="text" name="lastName" value={billing.lastName} onChange={handleChange} />
                        </div>
                      </div>
                      <div className="col-lg-12">
                        <div className="billing-info mb-20">
                          <label>Company Name</label>
                          <input type="text" name="company" value={billing.company} onChange={handleChange} />
                        </div>
                      </div>
                      <div className="col-lg-12">
                        <div className="billing-select mb-20">
                          <label>Country <span>*</span></label>
                          <select name="country" value={billing.country} onChange={handleChange}>
                            <option value="">Select a country</option>
                            <option>Azerbaijan</option>
                            <option>Bahamas</option>
                            <option>Bahrain</option>
                            <option>Bangladesh</option>
                            <option>Barbados</option>
                            <option>India</option>
                            <option>United States</option>
                            <option>United Kingdom</option>
                            <option>Germany</option>
                            <option>France</option>
                          </select>
                        </div>
                      </div>
                      <div className="col-lg-12">
                        <div className="billing-info mb-20">
                          <label>Street Address <span>*</span></label>
                          <input
                            className="billing-address"
                            placeholder="House number and street name"
                            type="text"
                            name="streetAddress"
                            value={billing.streetAddress}
                            onChange={handleChange}
                          />
                        </div>
                      </div>
                      <div className="col-lg-12">
                        <div className="billing-info mb-20">
                          <label>Town / City <span>*</span></label>
                          <input type="text" name="city" value={billing.city} onChange={handleChange} />
                        </div>
                      </div>
                      <div className="col-lg-6 col-md-6">
                        <div className="billing-info mb-20">
                          <label>State / County</label>
                          <input type="text" name="state" value={billing.state} onChange={handleChange} />
                        </div>
                      </div>
                      <div className="col-lg-6 col-md-6">
                        <div className="billing-info mb-20">
                          <label>Postcode / ZIP</label>
                          <input type="text" name="postcode" value={billing.postcode} onChange={handleChange} />
                        </div>
                      </div>
                      <div className="col-lg-6 col-md-6">
                        <div className="billing-info mb-20">
                          <label>Phone <span>*</span></label>
                          <input type="text" name="phone" value={billing.phone} onChange={handleChange} />
                        </div>
                      </div>
                      <div className="col-lg-6 col-md-6">
                        <div className="billing-info mb-20">
                          <label>Email Address <span>*</span></label>
                          <input type="email" name="email" value={billing.email} onChange={handleChange} />
                        </div>
                      </div>
                    </div>

                    <div className="additional-info-wrap">
                      <h4>Additional information</h4>
                      <div className="additional-info">
                        <label>Order notes</label>
                        <textarea
                          placeholder="Notes about your order, e.g. special notes for delivery."
                          name="orderNotes"
                          value={billing.orderNotes}
                          onChange={handleChange}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="col-lg-5">
                  <div className="your-order-area">
                    <h3>Your order</h3>
                    <div className="your-order-wrap gray-bg-4">
                      <div className="your-order-product-info">
                        <div className="your-order-top">
                          <ul>
                            <li>Product</li>
                            <li>Total</li>
                          </ul>
                        </div>
                        <div className="your-order-middle">
                          <ul>
                            {cartItems.map((cartItem, key) => {
                              const discountedPrice = getDiscountPrice(cartItem.price, cartItem.discount);
                              const finalProductPrice = (cartItem.price * currency.currencyRate).toFixed(2);
                              const finalDiscountedPrice = (discountedPrice * currency.currencyRate).toFixed(2);

                              discountedPrice != null
                                ? (cartTotalPrice += finalDiscountedPrice * cartItem.quantity)
                                : (cartTotalPrice += finalProductPrice * cartItem.quantity);
                              return (
                                <li key={key}>
                                  <span className="order-middle-left">
                                    {cartItem.name} X {cartItem.quantity}
                                  </span>{" "}
                                  <span className="order-price">
                                    {discountedPrice !== null
                                      ? currency.currencySymbol + (finalDiscountedPrice * cartItem.quantity).toFixed(2)
                                      : currency.currencySymbol + (finalProductPrice * cartItem.quantity).toFixed(2)}
                                  </span>
                                </li>
                              );
                            })}
                          </ul>
                        </div>
                        <div className="your-order-bottom">
                          <ul>
                            <li className="your-order-shipping">Shipping</li>
                            <li>Free shipping</li>
                          </ul>
                        </div>
                        <div className="your-order-total">
                          <ul>
                            <li className="order-total">Total</li>
                            <li>{currency.currencySymbol + cartTotalPrice.toFixed(2)}</li>
                          </ul>
                        </div>
                      </div>
                      <div className="payment-method"></div>
                    </div>
                    <div className="place-order mt-25">
                      <button className="btn-hover" onClick={handlePlaceOrder} disabled={loading}>
                        {loading ? "Placing Order..." : "Place Order"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="row">
                <div className="col-lg-12">
                  <div className="item-empty-area text-center">
                    <div className="item-empty-area__icon mb-30">
                      <i className="pe-7s-cash"></i>
                    </div>
                    <div className="item-empty-area__text">
                      No items found in cart to checkout <br />{" "}
                      <Link to={process.env.PUBLIC_URL + "/shop-grid-standard"}>
                        Shop Now
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </LayoutOne>
    </Fragment>
  );
};

export default Checkout;
