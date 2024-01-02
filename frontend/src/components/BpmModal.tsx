import React from "react";
import {useState} from "react";
import {Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, TextField} from "@mui/material";
import {first} from "lodash";

const BpmModal = ({open, setOpen}: {open: any, setOpen: any}) => {

    let tapTimestamps: number[] = []
    let bpm = null

    const handleClickOpen = () => {
        setOpen(true);
    };

    const handleClose = () => {
        tapTimestamps = []
        setOpen(false);
    };

    return (
        <React.Fragment>
            <Button variant="outlined" onClick={handleClickOpen}>
                Open form dialog
            </Button>
            <Dialog open={open} onClose={handleClose}>
                <DialogTitle>Subscribe</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        To subscribe to this website, please enter your email address here. We
                        will send updates occasionally.
                    </DialogContentText>
                    <canvas width={500} height={500} onClick={(e) => {
                        tapTimestamps.push(e.timeStamp)
                        if (tapTimestamps.length > 1) {
                            const delay = tapTimestamps[tapTimestamps.length - 1] - tapTimestamps[0]
                            const averageDelay = delay / tapTimestamps.length - 1
                            bpm = 60 / (averageDelay / 1000)
                            console.log(bpm)
                        }
                    }}>

                    </canvas>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleClose}>Cancel</Button>
                    <Button onClick={handleClose}>Subscribe</Button>
                </DialogActions>
            </Dialog>
        </React.Fragment>
    );
}

export default BpmModal