/**
 * Created by piyush0 on 22/05/17.
 */

const {ipcRenderer} = require('electron');

const MAX_DISPLAY_SIZE = 200;

let deleteReadySnipId = null;
let editReadySnip = null;
let modalTitle = null;
let modalLanguage = null;
let modalCode = null;
let codes = [];
let editBlock = '<td> <p data-placement="top" data-toggle="tooltip" title="Edit"><button onclick="readyToEdit(this)" class="btn btn-primary btn-xs" data-title="Edit" data-toggle="modal"data-target="#edit"><i class="fas fa-pencil-alt"></i></span></button></p></td> ';
let deleteBlock = '<td> <p data-placement="top" data-toggle="tooltip" title="Delete"><button onclick="readyToDelete(this)" class="btn btn-danger btn-xs" data-title="Delete" data-toggle="modal"data-target="#delete"><i class="fas fa-trash"></i></button> </p> </td>';
let copyBlock = '<td> <p data-placement="top"<button onclick="copyToClip(this)" class="btn btn-primary btn-xs" data-title="Copy"><i class="far fa-copy"></i></button></p> </td> '
let search_text=""

let hotkey =  ' <td>  <div class="input-group" style="width:300px;" >'
              +'<input type="text" class="form-control hotkey-text" placeholder="Set Key Combination">'
              +'<span class="input-group-btn">'
              +'<button onclick="SetHotKey(this)" class="btn btn-secondary" type="button">Set/Unset</button>'
              +'</span>'
              +'</div> </td>'

window.onload = function () {
    ipcRenderer.send('get-snips');
    ipcRenderer.send('getGithubUser', 'main');
};

function todate(timestamp) {
    const theDate = new Date((timestamp + 19800) * 1000);
    const dateString = theDate.getDate() + "/" + theDate.getMonth() + "/" + theDate.getFullYear();

    return dateString;
}

ipcRenderer.on('all-snips', function (event, data, isNewSession) {
    const table = document.getElementById("tablebody");
    const searchBox = document.getElementById("srch-term");
    searchBox.oninput = search
    table.innerHTML = "";
    console.log(data);
    for (let i = 0; i < data.length; i++) {
        codes[i] = data[i].code;
        if (data[i].code.length > MAX_DISPLAY_SIZE) {
            data[i].code = data[i].code.substring(0, MAX_DISPLAY_SIZE);
            data[i].code += "<i> More... </i>"
        }

        table.innerHTML += "<tr id=" + data[i]._id + ">" +
            "<td>" + data[i].title + "</td>" +
            "<td>" + data[i].language + "</td>" +
            "<td>" + todate(data[i].timestamp) + "</td>" +
            "<td id=" + i + '>' + "<pre>" + data[i].code + "</pre>" + "</td>" + editBlock + deleteBlock + copyBlock +
             hotkey +"</tr>"

        if(data[i].hotkey!=null && isNewSession===true){
            ipcRenderer.send('hotkey-set', data[i]._id, data[i].hotkey, data[i].code)
        }

        if(data[i].hotkey!=null && isNewSession===false){
            $("#"+data[i]._id).find(".hotkey-text").css('box-shadow','0px 1px 1px rgba(0, 0, 0, 0.075) \
                                            inset, 0px 0px 8px rgba(255, 100, 255, 0.5)');
            $("#"+data[i]._id).find(".hotkey-text").attr('value', data[i].hotkey);
            $("#"+data[i]._id).find(".hotkey-text").attr('readonly', true);
            $("#"+data[i]._id).find(".hotkey-text").attr('set', true);
        }

        console.log(data[i]._id+"  "+data[i].hotkey);
    }
});

function search(event) {
    ipcRenderer.send('search-snip', event.srcElement.value);
    search_text=event.srcElement.value;
}

function copyToClip(element) {
    element = element.parentNode.parentNode;
    let code = codes[element.firstChild.nextSibling.nextSibling.nextSibling.id];

    ipcRenderer.send('copy-to-clip', code);
}


function readyToDelete(element) {
    element = element.parentNode.parentNode.parentNode;
    deleteReadySnipId = element.id;
}

function readyToEdit(element) {
    element = element.parentNode.parentNode.parentNode;

    editReadySnip = {
        id: element.id,
        title: element.firstChild.innerHTML,
        language: element.firstChild.nextSibling.innerHTML,
        code: codes[element.firstChild.nextSibling.nextSibling.nextSibling.id]
    };

    modalTitle = document.getElementById("title");
    modalLanguage = document.getElementById("language");
    modalCode = ace.edit("editor");

    modalTitle.setAttribute("value", editReadySnip.title);
    modalLanguage.setAttribute("value", editReadySnip.language);
    modalCode.setValue(editReadySnip.code);
}

ipcRenderer.on('invalid_key_error', function (event, err) {
    $.toaster({ message : "Invalid Key" , priority : 'danger' });
});

ipcRenderer.on('hotkey-set-return', function (event, iftrue, id, message, hotkey) {
    
    if(iftrue){
        $("#"+id).find(".hotkey-text").css('box-shadow','0px 1px 1px rgba(0, 0, 0, 0.075) \
                                            inset, 0px 0px 8px rgba(255, 100, 255, 0.5)');
        $("#"+id).find(".hotkey-text").attr('value', hotkey);
        $("#"+id).find(".hotkey-text").attr('readonly', true);
        $("#"+id).find(".hotkey-text").attr('set', true);
    }
    else{
        $("#"+id).find(".hotkey-text").attr('value', "");
    }
    if(message===" registration successful "){
        $.toaster({ message : message , priority : 'success' });
    }
    else{
        $.toaster({ message : message , priority : 'danger' });
    }

    console.log(message+" "+id);

});

ipcRenderer.on('githubUser', function (event, data, newSession) {
    if (data) {
        //user is loggedIn via github
        $('#loginGithubButton').hide()
        $('#syncGistButton').show()
    } else {
        $('#loginGithubButton').show()
        $('#syncGistButton').hide()
    }
})

function SetHotKey(element) {

    element_parent = element.parentNode.parentNode.parentNode.parentNode;
    if( $("#"+element_parent.id).find(".hotkey-text").attr('set') === "true"){
        ipcRenderer.send('hotkey-unset', element_parent.id, $("#"+element_parent.id).find(".hotkey-text").attr('value'));
        $("#"+element_parent.id).find(".hotkey-text").attr('set',false);
        $("#"+element_parent.id).find(".hotkey-text").attr('value',"");
        $("#"+element_parent.id).find(".hotkey-text").removeAttr('readonly');
        $("#"+element_parent.id).find(".hotkey-text").removeAttr('style');
        $.toaster({ message : "Unregistered" , priority : 'success' });
    }
    else{
        ipcRenderer.send('hotkey-set', element_parent.id, element.parentNode.parentNode.firstChild.value,
                                    codes[element_parent.firstChild.nextSibling.nextSibling.nextSibling.id])
    }

}

function openhelp() {
    ipcRenderer.send('openhelp');
}

function editSnip() {
    const snip = {
        "_id": editReadySnip.id,
        "title": modalTitle.value,
        "language": modalLanguage.value,
        "code": modalCode.getValue(),
        "hotkey": $("#"+editReadySnip.id).find(".hotkey-text").attr('value')
    };

    ipcRenderer.send('new-snip-add', JSON.stringify(snip))
}

function deleteSnip() {
    
    ipcRenderer.send('delete-snip', deleteReadySnipId,$("#"+deleteReadySnipId).find(".hotkey-text").attr('value'));
};

function newSnip() {
    ipcRenderer.send('new-snip');
};

function syncGists() {
    ipcRenderer.send('sync-gists');
}

$(".arrow-down, .arrow-up").click(function(e){

    if($(this).hasClass('arrow-up') ){
        ipcRenderer.send('sort-dec',$(this).attr('id'),search_text);
    }
    else{
        ipcRenderer.send('sort-inc',$(this).attr('id'),search_text);
    }

    $(this).toggleClass('arrow-down arrow-up')

})

function loginViaGithub() {
    ipcRenderer.send('github-login');
}