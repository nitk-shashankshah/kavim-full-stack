import PropTypes from "prop-types";

import { Link } from "react-router-dom";

const HeroSliderOneSingle = ({ data }) => {
  return (
    <div className="single-slider slider-height-1">
      <div className="container">
        <div className="row">
          {/*<div className="col-xl-6 col-lg-6 col-md-6 col-12 col-sm-6">
            <div className="slider-content slider-animated-1">
              <h3 className="animated">{data.title}</h3>
              <h1 className="animated">{data.subtitle}</h1>
              <div className="slider-btn btn-hover">
                <Link
                  className="animated"
                  to={process.env.PUBLIC_URL + data.url}
                >
                  SHOP NOW
                </Link>
              </div>
            </div>
          </div>*/}
          <div className="col-xl-12 col-lg-12 col-md-12 col-12 col-sm-12">
            <div className="slider-single-img slider-animated-1">
              <img
                className="animated img-fluid"
                src={process.env.PUBLIC_URL + data.image}
                alt=""
              />
            </div>
            <div className="slider-content slider-animated-1" style={{"position": "absolute", "top": "50%", "left": "50%", "transform": "translate(-50%, -50%)", "text-align": "center"}}>
              <h3 className="animated" style={{color:"#fff"}}>{data.title}</h3>
              <h1 className="animated" style={{color:"#fff"}}>{data.subtitle}</h1>
              <div className="slider-btn btn-hover">
                <Link
                  className="animated"
                  to={process.env.PUBLIC_URL + data.url}
                  style={{color:"#fff"}}
                >
                  SHOP NOW
                </Link>
              </div>
            </div>
          </div>
          {/*<div className="col-xl-6 col-lg-6 col-md-6 col-12 col-sm-6">
            <div className="slider-single-img slider-animated-1">
              <img
                className="animated img-fluid"
                src={process.env.PUBLIC_URL + data.image}
                alt=""
              />
            </div>
          </div>*/}
        </div>
      </div>
    </div>
  );
};

HeroSliderOneSingle.propTypes = {
  data: PropTypes.shape({})
};

export default HeroSliderOneSingle;
