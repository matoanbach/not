class Solution:
    def canReorderDoubled(self, arr: List[int]) -> bool: 
        """
        [4,-2,2,-4]
        -2 2 -4 4
        _____
        -2: 0
        2 : 0
        -4: 0
        4 : 0
        5 : 3
        10: 2

        count the occurences of each number in the list
        for each number in sorted arr based on abs value:
            if occurrence of number == 0:
                skip it
            if occurrence of 2 * number == 0:
                return false

        {1: 2, 2: 2, 4: 2, 16: 1, 8: 1}
    Note:
        1. Have to sort "arr" in increasing order based on abs value
            because we want to process the smaller values first
                [-4, -2, 2, 4] -> sorted in increasing order w/o abs values
                               -> process -4 first: the right way is to process -2 first
                
            
        """
        count = Counter(arr)
        for num in sorted(arr, key=abs):
            if count[num] == 0:
                continue
            if count[2*num] == 0: # num can't map to 2*num that doesnt exist
                return False
            count[num] -= 1
            count[2*num] -= 1
        
        return True