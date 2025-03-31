import React from 'react';
import ReactDOM from 'react-dom'; // Import ReactDOM for Portal
import './Modal.css'; // Import CSS for styling

// Separate Backdrop component (can be clicked to close)
const Backdrop = (props) => {
  return <div className="backdrop" onClick={props.onClose} />;
};

// Separate Modal Overlay component (holds the content)
const ModalOverlay = (props) => {
  return (
    <div className="modal">
      <div className="modal-content">{props.children}</div>
    </div>
  );
};

// Get reference to the portal target element in index.html
const portalElement = document.getElementById('overlays');

// The main Modal component
function Modal(props) {
  return (
    // Use React Fragments <>...</> to return multiple elements
    <>
      {/* Render Backdrop and ModalOverlay using Portal into the 'overlays' div */}
      {ReactDOM.createPortal(<Backdrop onClose={props.onClose} />, portalElement)}
      {ReactDOM.createPortal(
        <ModalOverlay>{props.children}</ModalOverlay>, // Render children inside overlay
        portalElement
      )}
    </>
  );
}

export default Modal;