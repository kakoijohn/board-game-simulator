function noScroll() {
  $('.table_container').scrollTo(0, 0);
}
// add listener to disable scroll
$('.table_container').addEventListener('scroll', noScroll);

$('.table_container').scroll(function() {
  
});