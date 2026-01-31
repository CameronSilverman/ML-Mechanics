import React, { useState } from 'react';
import ImageComponent from './image_comp';
import { useDrop } from 'react-dnd';
// eslint-disable-next-line
import {MarkerImageList, MockImageList} from './images';
import '../css/whitebstyle.css';

const WhiteboardContainer = () => {
  let elementCounter = 0;

  const [images, setImages] = useState([]);

  // eslint-disable-next-line
  const [{isOver}, drop] = useDrop(() => ({
    accept: 'image-comp',
    drop: (item, monitor)=>{
      const offset = monitor.getDifferenceFromInitialOffset();
      handleDrop(item, item.id, offset);
    },
    collect: (monitor) => ({
      isOver: !!monitor.isOver()
    }),
  }))

  const handleDrop = (item, id, offset) => {
    if (item.isMarker){
      const myDiv = document.getElementById(id);

      const topPosition = myDiv.offsetTop;
      const leftPosition = myDiv.offsetLeft;
      const position = {x: (leftPosition + offset.x), y: (topPosition + offset.y)};
      // CHECK markers.js to ensure image lists match
      const newImageList = MarkerImageList.filter((im) => id === im.id);
      // const newImageList = MockImageList.filter((im) => id === im.id);
      newImageList[0] = {...newImageList[0]}
      newImageList[0].isMarker = false;
      newImageList[0].position = position;
      elementCounter++;
      newImageList[0].id = newImageList[0].id + elementCounter.toString();
      newImageList[0].zIndex = 1; //Update base div z-index

      console.log(newImageList[0])
      // console.log('(' + newImageList[0].initialPosition.x + ', ' + newImageList[0].initialPosition.y + ')')
      
      setImages(prevImages => [...prevImages, newImageList[0]]);

    }else{
      const position = {x: (item.initialPosition.x + offset.x), y: (item.initialPosition.y + offset.y)};
      // console.log('(' + position.x + ', ' + position.y + ')');
      setImages(prevImages =>
          prevImages.map(img =>
            img.id === id ? { ...img, position} : img
          )
      );
    }
    
  };

  return (
      <div ref={drop} class='whiteboard-container'>
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

export default WhiteboardContainer;