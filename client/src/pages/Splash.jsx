import React from "react";
import { Button } from "react-bootstrap";
import { Link } from "react-router-dom";
import collegeImg from "../assets/college.jpg";

const Splash = () => {
  return (
    <div
      style={{
        height: "100vh",
        width: "100%",
        position: "relative",
        overflow: "hidden"
      }}
    >
      {/* Background Image */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `url(${collegeImg})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          filter: "blur(3px)",
          transform: "scale(1.1)",
          animation: "zoomBg 12s ease-in-out infinite alternate"
        }}
      />

      {/* Dark overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundColor: "rgba(0,0,0,0.5)"
        }}
      />

      {/* Content */}
      <div
        style={{
          position: "relative",
          zIndex: 2,
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          color: "white",
          padding: "20px"
        }}
      >
        {/* App Name */}
        <h1 className="fade-up delay-1 brand">
          CAMPUSCART
        </h1>

        {/* Main Slogan */}
        <h2 className="fade-up delay-2 main-text">
          Everything you need in one place
        </h2>

        {/* Sub text */}
        <p className="fade-up delay-3 sub-text">
          Watch this space for discovering, sharing and finding the right
          materials for your campus life.
        </p>

        {/* Button */}
        <div className="fade-up delay-4">
          <Button
            as={Link}
            to="/home"
            size="lg"
            className="get-started-btn"
          >
            Get Started
          </Button>
        </div>
      </div>

      {/* Styles */}
      <style>
        {`
          @keyframes fadeUp {
            from {
              opacity: 0;
              transform: translateY(30px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          @keyframes zoomBg {
            from {
              transform: scale(1.1);
            }
            to {
              transform: scale(1.2);
            }
          }

          .fade-up {
            opacity: 0;
            animation: fadeUp 1s ease forwards;
          }

          .delay-1 { animation-delay: 0.3s; }
          .delay-2 { animation-delay: 0.7s; }
          .delay-3 { animation-delay: 1.1s; }
          .delay-4 { animation-delay: 1.5s; }

          .brand {
            letter-spacing: 5px;
            font-weight: 1000;
            margin-bottom: 20px;
            color: #93c5fd;
            font-size: 70px;
          }

          .main-text {
            font-size: 50px;
            font-weight: 700;
            line-height: 1.1;
            max-width: 900px;
            margin-bottom: 20px;
          }

          .sub-text {
            font-size: 20px;
            max-width: 720px;
            margin-bottom: 40px;
            color: #e5e7eb;
          }

          .get-started-btn {
            padding: 14px 40px;
            font-size: 18px;
            font-weight: 600;
            border-radius: 999px;
            background-color: #2563eb;
            border: none;
            transition: all 0.3s ease;
          }

          .get-started-btn:hover {
            background-color: #1d4ed8;
            transform: translateY(-3px) scale(1.05);
            box-shadow: 0 12px 30px rgba(37, 99, 235, 0.4);
          }
        `}
      </style>
    </div>
  );
};

export default Splash;
