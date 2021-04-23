import React,{useEffect,useState,useCallback} from 'react'
import Quill from 'quill'
import {io} from 'socket.io-client'
import 'quill/dist/quill.snow.css'
import {useParams} from 'react-router-dom'
const TOOLBAR_OPTIONS = [
    [{header: [1,2,3,4,5,6,false]}],
    [{font:[]}],
    [{list:"ordered"},{list:"bullet"}],
    ["bold","italic","underline"],
    [{color:[]},{background:[]}],
    [{script:"sub"},{script:"super"}],
    [{align:[]}],
    ["image","blockquote","code-block"],
    ["clean"]

]
function TextEditor() {
    const {id:documentId}=useParams();
    const [socket,setSocket] =useState();
    const [quill,setQuill] =useState();
    useEffect(()=>{
        if(socket==null||quill==null) return;

        socket.once("load-document",document=>{
            quill.setContents(document);
            quill.enable();
        })
        socket.emit("get-document",documentId);
    },[socket,quill,documentId])
    useEffect(()=>{
        const s = io("http://localhost:3001");
        setSocket(s);
        return()=>{
            s.disconnect();
        }
    },[])
    useEffect(()=>{
        if(socket==null||quill==null) return;
        const handler=(delta)=>{
            quill.updateContents(delta)
        };
        socket.on("receive-changes",handler);
        return()=>{
            socket.off("receive-changes",handler);
        }
    },[socket,quill])
    useEffect(()=>{
        if(socket==null||quill==null) return;
        const interval=setInterval(()=>{
            socket.emit("save-document",quill.getContents());
        },2000)
        return()=>{
            clearInterval(interval);
        }
    },[socket,quill])
   
    useEffect(()=>{
        if(socket==null||quill==null) return;
        const handler=(delta,oldDelta,source)=>{
            if(source!=="user") return;
            socket.emit("send-changes",delta)
        };

        quill.on("text-change",handler);
        return()=>{
            quill.off("text-change",handler);
        }
    },[socket,quill])

    const wrapperRef=useCallback((wrapper)=>{
        if(!wrapper) return;
        wrapper.innerHTML="";
        const editor=document.createElement('div');
        wrapper.appendChild(editor);
        const q=new Quill(editor,{theme:"snow",modules:{toolbar:TOOLBAR_OPTIONS}})
        q.disable();
        q.setText("Loading...")
        setQuill(q);
    },[])
    
    return (
        <div className="container" ref={wrapperRef}>
           
        </div>
    )
}

export default TextEditor
