import React from 'react';
import {Link} from 'react-router-dom';
import '../css/whitebstyle.css';
import WhiteboardContainer from  '../whiteboard_comps/whiteboard';
import MarkersContainer from '../whiteboard_comps/markers';

function Whiteboard() {
  return (
    <div class="full-div">
        <div class="whiteboard-header">
            <div class="navigation">
                <Link class="navLinks" to="/">Home</Link>
            </div>
            <div class="compile-div">
                <Link class="navLinks" >Compile</Link>
            </div>
        </div>

        <WhiteboardContainer />
        
        <MarkersContainer />

    </div>
  )
}

export default Whiteboard