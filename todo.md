create migration schematic to migrate from rxStateful$ to rxStatefulRequest
pattern: name$ = rxStateful$(whatever) 
-> name = rxStatefulRequest(whatever)

and derived usages will be adjusted like name.value$()
