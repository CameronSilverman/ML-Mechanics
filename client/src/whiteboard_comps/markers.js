import React, { useState } from 'react';
import ImageComponent from './image_comp';
// eslint-disable-next-line
import { MarkerImageList, MockImageList} from './images';
import '../css/whitebstyle.css';

const MarkersContainer = () => {
    // CHECK whiteboard.js to ensure image lists match
    // eslint-disable-next-line
    const [images, setImages] = useState(MarkerImageList);
    // eslint-disable-next-line
    // const [images, setImages] = useState(MockImageList);
    return (
      <div class ="markers-area">
          {images.map((image) => (
              <ImageComponent
              id={image.id}
              imageSrc={image.src}
              initialPosition={image.position}
              isMarker={image.isMarker}
              zIndex={image.zIndex}
              />
          ))}
      </div>
  );
};

export default MarkersContainer;