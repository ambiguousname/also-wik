function resetSettings(){
    localStorage.clear();
    $("#primary-color").val("#FFFFFF");
    $("#secondary-color").val("#000000");
    $("#font").val("Segoe UI");
    $("#fontSize").val("16");
    changeSecondaryColor();
    changePrimaryColor();
    updateFont();
    updateSize();
    hideTitle();
}

function updateSlideColors(){
    let secondary = $("#secondary-color").val();
    let primary = $("#primary-color").val();
    let fontSize = parseInt($("#fontSize").val());
    $(".controls-arrow").css("color", secondary);
    $(".slides").css("color", secondary).css("font-size", (fontSize * 5) + "px");
    $("a").css("color", secondary);
    $(".slides p, .slides a").css("font-size", fontSize + "px");
    $(".progress").css("color", secondary).css("background-color", primary);
}

function hideAcknowledge(){
    $("#acknowledgement").fadeOut(500, function(){
        $("#customize").fadeIn(500);
    });
}

function changeSecondaryColor(){
    let val = $("#secondary-color").val();
    $(".centered").css("color", val);
    $(".btn-primary").css("background-color", val);
    localStorage.setItem("secondary-color", val);
}

function changePrimaryColor(){
    let val = $("#primary-color").val();
    $("body").css("background-color", val);
    $(".btn-primary").css("color", val);
    localStorage.setItem("primary-color", val);
}

function updateFont(){
    let font = $("#font").val();
    $("body").css("font-family", font);
    localStorage.setItem("font", font);
}

function updateSize(){
    var size = parseInt($("#fontSize").val());

    if (size > $("#fontSize").attr("max")){
        size = $("#fontSize").attr("max");
    }
    if (size < $("#fontSize").attr("min")){
        size = $("#fontSize").attr("min");
    }
    $("#fontSize").val(size);
    $("body").css("font-size", size + "px");
    $(".btn-primary").css("font-size", size + "px")
    $(".form-select").css("font-size", size+"px");
    localStorage.setItem("font-size", size);
}