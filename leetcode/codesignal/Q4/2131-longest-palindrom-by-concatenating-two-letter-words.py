class Solution:
    def longestPalindrome(self, words: List[str]) -> int:
        """
        pair1 = 2 --- 
        pair2 = 1
        pair3 = 3 -> take 2 
        pair4 = 5 -> take 4
        
        pair1_1 pair_2 pair_2

        rule1: only add one odd pair
        rule2: add even pairs as much as possible
        """
        count = defaultdict(int)

        for word in words:
            count[word] = count.get(word, 0) + 1
        
        # count even occurence
        output = 0
        hasOdd = False
        for word, cnt in count.items():
            if word[0] == word[1]:
                if cnt % 2 == 0:
                    output += cnt
                else:
                    output += cnt - 1
                    hasOdd = True
            elif word[0] < word[1] and word[1] + word[0] in count:
                output += 2 * min(cnt, count[word[1] + word[0]])
    
        if hasOdd:
            output += 1

        return output * 2
        