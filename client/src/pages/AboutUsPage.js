import React from 'react';
import {Link} from 'react-router-dom';
import '../css/genstyle.css';

function AboutUs() {
  return (
    <div class="full-div">
        <div class="header">
            <h1 class="websiteTitle">NAME PLACEHOLDER</h1>{/*Replace with actual name before deployment*/}
            <nav>
                <div class="navigation">
                    <Link class="navLinks" to="/">Home</Link>
                    <Link class="navLinks" to="/About-Us">About Us</Link>
                    <Link class="navLinks" to="/Whiteboard">Whiteboard</Link>
                </div>
            </nav>
        </div>
        <h1>About Us</h1>
    </div>
);
}

export default AboutUs