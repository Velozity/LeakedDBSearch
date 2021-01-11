$(document).ready(function(){
    M.updateTextFields();
    $('.collapsible').collapsible();
    $('.parallax').parallax();
    $('select').formSelect();
    $('.tooltipped').tooltip();
    $('#menuDropMobile').dropdown({
        constrainWidth: false, 
        container: $('#mobileDropContainer'),
        gutter: 0, // Spacing from edge
        alignment: 'down'
    })

    M.updateTextFields();

    var elem = document.querySelectorAll('.collapsible.expandable');

    elem.forEach((e) => { 
        M.Collapsible.init(e, {
        accordion: false
        });
    });

    $('.counter').each(function() {
        var $this = $(this),
            countTo = $this.attr('data-count');
        
        $({ countNum: $this.text()}).animate({
          countNum: countTo
        },
      
        {
      
          duration: 4000,
          easing:'linear',
          step: function() {
            $this.text(Math.floor(this.countNum).toString().replace(/\B(?<!\.\d*)(?=(\d{3})+(?!\d))/g, ","));
          },
          complete: function() {
            $this.text(this.countNum.toString().replace(/\B(?<!\.\d*)(?=(\d{3})+(?!\d))/g, ","));
            //alert('finished');
          }
      
        });  
        
        
      
      });
});

function updateNumberOnly() {
    $('.numberonly').keypress((e) => {
        let reg = new RegExp('^[0-9]+$');
        if(!reg.test(e.key)) 
            e.preventDefault();
    })
}
