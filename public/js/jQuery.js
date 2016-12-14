
jQuery(document).ready(function(){
     //Repositioning the texts according to the image size
    var height = (675/$("#planetmap").height());
    var width = (1200/$("#planetmap").width());
    console.log($("#planetmap").height()+" "+$("#planetmap").offset().top+" "+$("#indonesiaText").offset().top);
    var size = parseInt($(".text").css('font-size'));
    var text_array = $('.text');
    for(var i=0;i<text_array.length;i++) {
        $(text_array[i]).css("position", "absolute");
        $(text_array[i]).css({top: ((($(text_array[i]).position().top)/height)+5), left: ((($(text_array[i]).position().left)/width)+20)});
        $(".text").css('font-size', size/height);
    }
    // This button will increment the value
    $('.qtyplus').click(function(e){
        // Stop acting like a button
        e.preventDefault();
        // Get the field name
        fieldName = $(this).attr('field');
        // Get its current value
        currentVal = parseInt($('input[name='+fieldName+']').val());
        // If is not undefined
        if (!isNaN(currentVal)) {
            // Increment
            $('input[name='+fieldName+']').val(currentVal + 1);
        } else {
            // Otherwise put a 0 there
            $('input[name='+fieldName+']').val(0);
        }
    });
    // This button will decrement the value till 0
    $(".qtyminus").click(function(e) {
        // Stop acting like a button
        e.preventDefault();
        // Get the field name
        fieldName = $(this).attr('field');
        // Get its current value
        currentVal = parseInt($('input[name='+fieldName+']').val());
        // If it isn't undefined or its greater than 0
        if (!isNaN(currentVal) && currentVal > 0) {
            // Decrement one
            $('input[name='+fieldName+']').val(currentVal - 1);
        } else {
            // Otherwise put a 0 there
            $('input[name='+fieldName+']').val(0);
        }
    });
});
