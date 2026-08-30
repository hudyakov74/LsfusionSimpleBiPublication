menu for bi publication:
add in NAVIGATOR in module MAIN         

NAVIGATOR {
  NEW biViewForm;  
}


for oneClick copy from FOOTER add

onWebClientInit() + {
    onWebClientInit('myBalanceCopyFooter.js') <- 1;
}

for Calculator on numeric input  add

onWebClientInit() + {
    onWebClientInit('myBalanceCalculator.css') <- 1;
    onWebClientInit('myBalanceCalculator.js') <- 1;
}
