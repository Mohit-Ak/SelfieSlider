from pymongo import MongoClient
import urllib
client = MongoClient("mongodb://dockerhost:27017")
db = client['selfiedb']
followsusers = db['followsusers']
cursor = followsusers.find()
for document in cursor:
    print document['userName']
    media = document['media']
    for item in media:
    	#print item['imageURL']
    	imageURL=item['imageURL']
    	imageName = imageURL.rsplit('/',1)[1]
    	print imageName
    	urllib.urlretrieve(imageURL, imageName)

    	# urllib.urlretrieve(URL, IMAGE)

# result = followsusers.update_one(
#     {"userName": "krishnapranavesh"},
#     {
#         "$set": {
#             "media": [{'imageURL' : 'test image url5', 'productRelated' : '5'}]
#         }
#     }
# )

#print(result.matched_count)