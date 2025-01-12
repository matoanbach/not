class Solution:
    def numPairsDivisibleBy60(self, time: List[int]) -> int:
        """
        (a + b) = 1
        ____
        60

        150/60 = 30
        30/60 = 
        """
        bucket = defaultdict(int)
        output = 0
        for hour in time[::-1]:
            if hour % 60 == 0:
                output += bucket[hour % 60]
            else:
                output += bucket[60 - (hour % 60)]
        
            bucket[hour % 60] += 1


        return output