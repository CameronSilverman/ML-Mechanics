import React from 'react';
import { useDrag } from 'react-dnd';

const ImageComponent = ({ id, imageSrc, initialPosition, isMarker, zIndex}) => {
  const zIndex2 = zIndex + 1;
  const [{ isDragging }, dragRef] = useDrag({
    type: 'image-comp',
    item: { id: id, imageSrc: imageSrc, initialPosition: initialPosition, isMarker: isMarker},
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),//Maybe convert to boolean with !! prefix
    }), 
  });
  
  return (
    <div
      ref={dragRef}
      style={{
        opacity: isDragging ? 0.5 : 1,
        cursor: 'grab',
        display: isMarker? 'block' : null,
        position: isMarker? null : 'absolute',
        top: isMarker ? null : (initialPosition ? initialPosition.y : null),  
        left: isMarker ? null : (initialPosition ? initialPosition.x : null),
        margin: '10px', //Make relative to marker area size
        border: '1px solid #000000',
        // background: '#FF0000',
        zIndex: zIndex,
        
      }}
      id={id}
    >
      <img src={imageSrc} alt="Draggable Img" style={{ width: 120 , height: '100%', draggable: false, zIndex: zIndex2}} />
      {/* FIX-ME: Width is currently hard coded. Need to make it so that the container div does not automatically scale the width 
      down to fit the markers-area flexbox, preventing the scroll function. Same with height.*/}
    </div>
  );
};

export default ImageComponent;