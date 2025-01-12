class Solution:
    def fourSumCount(self, nums1: List[int], nums2: List[int], nums3: List[int], nums4: List[int]) -> int:
        mapA = defaultdict(int)
        for s1 in nums1:
            for s2 in nums2:
                mapA[s1 + s2] += 1
        
        output = 0
        for s3 in nums3:
            for s4 in nums4:
                output += mapA[-1 * (s3 + s4)]

        return output