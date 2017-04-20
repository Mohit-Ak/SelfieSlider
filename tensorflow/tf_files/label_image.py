import tensorflow as tf, sys
from pymongo import MongoClient
import urllib
import json
client = MongoClient("mongodb://dockerhost:27017")
db = client['selfiedb']
followsusers = db['followsusers']
cursor = followsusers.find()
#image_path = sys.argv[1]

for document in cursor:
    print document['userName']
    media = document['media']
    media_str_array = []
    for item in media:
        #print item['imageURL']
        image_path=item['imageURL']
        image_name = image_path.rsplit('/',1)[1]
        print image_path
        
        try:
            image_data = tf.gfile.FastGFile(image_name, 'rb').read()
        except:
            print 'image not present locally - '+image_path
            urllib.urlretrieve(image_path, image_name)
      
        print 'image being fed to tensorflow'
        try:
            
            # Read in the image_data
            image_data = tf.gfile.FastGFile(image_name, 'rb').read()
            print 'line 1'
            # Loads label file, strips off carriage return
            label_lines = [line.rstrip() for line 
                               in tf.gfile.GFile("/tf_files/retrained_labels.txt")]
            print 'line 2'
            # Unpersists graph from file
            with tf.gfile.FastGFile("/tf_files/retrained_graph.pb", 'rb') as f:
                graph_def = tf.GraphDef()
                graph_def.ParseFromString(f.read())
                _ = tf.import_graph_def(graph_def, name='')
            print 'line 3'
            with tf.Session() as sess:
                # Feed the image_data as input to the graph and get first prediction
                softmax_tensor = sess.graph.get_tensor_by_name('final_result:0')
                print 'line 4'
                predictions = sess.run(softmax_tensor, \
                         {'DecodeJpeg/contents:0': image_data})
                print 'line 5'
                # Sort to show labels of first prediction in order of confidence
                top_k = predictions[0].argsort()[-len(predictions[0]):][::-1]
                print 'line 6'
                for node_id in top_k:
                    print 'line 7'
                    human_string = label_lines[node_id]
                    score = predictions[0][node_id]
                    print('%s (score = %.5f)' % (human_string, score))
                    # print human_string
                    # score=score*100
                    if human_string=='iphones' and score>=75:
                        tempJson={'imageURL':image_path, 'productRelated' : '1'}
                    elif human_string=='iphones':
                        tempJson={'imageURL':image_path, 'productRelated' : '-1'}
                media_str_array.append(json.dumps(tempJson))
        except:
            print 'Exception in tensorflow'
    result = followsusers.update_one(
        {"userName": document['userName']},
        {
            "$set": {
                "media": media_str_array
            }
        }
    )
    print 'user saved'


